import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { initPhysics } from '../physics/engineSetup';
import Toolbar from './Toolbar';
import { socket } from '/sockets/socketManager'; 

const PhysicsCanvas = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const runnerRef = useRef(null);
  const mouseConstraintRef = useRef(null); 
  
  const guestDraggingIdRef = useRef(null); 
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  
  const hudBodiesRef = useRef(null);
  const hudConstraintsRef = useRef(null);
  
  const [activeTool, setActiveTool] = useState('pointer');
  const activeToolRef = useRef(activeTool); 
  const selectedBodyForConstraintRef = useRef(null);

  const [roomId, setRoomId] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [role, setRole] = useState(null);
  
  // NEW: Environment State
  const [isZeroG, setIsZeroG] = useState(false);

  useEffect(() => {
    activeToolRef.current = activeTool;
    selectedBodyForConstraintRef.current = null; 

    if (mouseConstraintRef.current) {
      mouseConstraintRef.current.collisionFilter.mask = activeTool === 'pointer' ? 0xFFFFFFFF : 0x00000000;
    }
  }, [activeTool]);

  useEffect(() => {
    if (!sceneRef.current) return;

    socket.connect();
    const { engine, runner, mouseConstraint, cleanup } = initPhysics(sceneRef);
    engineRef.current = engine;
    runnerRef.current = runner;
    mouseConstraintRef.current = mouseConstraint;

    let handleCanvasMouseDown, handleGuestMouseMove, handleGuestMouseUp;
    const canvas = sceneRef.current.querySelector('canvas');

    socket.on('role-assigned', (data) => {
      setRole(data.role);
      
      if (data.role === 'host') {
        Matter.Runner.run(runnerRef.current, engineRef.current);
        
        Matter.Events.on(engineRef.current, 'afterUpdate', () => {
          const allBodies = Matter.Composite.allBodies(engineRef.current.world);
          const allConstraints = Matter.Composite.allConstraints(engineRef.current.world);
          
          if (engineRef.current.timing.timestamp % 10 < 2) {
            if (hudBodiesRef.current) hudBodiesRef.current.innerText = allBodies.filter(b => !b.isStatic).length;
            if (hudConstraintsRef.current) {
              // THE BUG FIX: Correct joint count by subtracting the native mouse puller.
              const activeConstraints = allConstraints.filter(c => !(mouseConstraintRef.current && c === mouseConstraintRef.current.constraint));
              hudConstraintsRef.current.innerText = activeConstraints.length;
            }
          }

          allBodies.forEach(b => {
            if (b.isGuestDragging) {
              Matter.Body.setVelocity(b, { x: 0, y: 0 });
              Matter.Body.setAngularVelocity(b, 0);
              b.force = { x: 0, y: 0 }; 
            }
          });

          const movingBodies = allBodies.filter(b => !b.isStatic || b.isGuestDragging).map(b => ({
              id: b.id, x: b.position.x, y: b.position.y, angle: b.angle, velocity: b.velocity
          }));
          socket.emit('physics-sync', movingBodies);
        });

        socket.on('host-apply-guest-grab', ({ id }) => {
          const body = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === id);
          if (body) body.isGuestDragging = true;
        });

        socket.on('host-apply-guest-drag', (dragData) => {
          const body = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === dragData.id);
          if (body) Matter.Body.setPosition(body, { x: dragData.x, y: dragData.y });
        });

        socket.on('host-apply-guest-drop', ({ id }) => {
          const body = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === id);
          if (body) {
            body.isGuestDragging = false;
            Matter.Body.set(body, 'isSleeping', false); 
          }
        });

      } else {
        Matter.Runner.stop(runnerRef.current);
        socket.emit('request-initial-state');
      }

      if (canvas) {
        const getLogicalMouse = (e) => {
          const rect = canvas.getBoundingClientRect();
          return {
            x: (e.clientX - rect.left) * (1200 / rect.width),
            y: (e.clientY - rect.top) * (800 / rect.height)
          };
        };

        handleCanvasMouseDown = (e) => {
          const mousePos = getLogicalMouse(e);
          const bodies = Matter.Composite.allBodies(engineRef.current.world).filter(b => !b.isStatic);
          const clicked = Matter.Query.point(bodies, mousePos);
          
          if (clicked.length > 0) {
            const body = clicked[0];

            if (activeToolRef.current === 'pointer' && role === 'guest') {
              guestDraggingIdRef.current = body.id;
              dragOffsetRef.current = { x: body.position.x - mousePos.x, y: body.position.y - mousePos.y };
              socket.emit('guest-grab', { id: body.id });
            } 
            else if (activeToolRef.current === 'joint' || activeToolRef.current === 'spring') {
              if (!selectedBodyForConstraintRef.current) {
                selectedBodyForConstraintRef.current = body.id;
              } else {
                if (selectedBodyForConstraintRef.current !== body.id) {
                  const bodyA = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === selectedBodyForConstraintRef.current);
                  const currentDist = Math.hypot(bodyA.position.x - body.position.x, bodyA.position.y - body.position.y);
                  const constraintLength = activeToolRef.current === 'spring' ? 0 : currentDist;
                  const newConstraintId = Math.floor(Math.random() * 10000000);

                  socket.emit('spawn-constraint', { id: newConstraintId, type: activeToolRef.current, bodyAId: bodyA.id, bodyBId: body.id, length: constraintLength });
                }
                selectedBodyForConstraintRef.current = null;
              }
            }
          } else {
            selectedBodyForConstraintRef.current = null;
          }
        };

        handleGuestMouseMove = (e) => {
          if (activeToolRef.current !== 'pointer' || !guestDraggingIdRef.current) return;
          const mousePos = getLogicalMouse(e);
          const draggingBody = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === guestDraggingIdRef.current);
          
          if (draggingBody) {
            let targetX = mousePos.x + dragOffsetRef.current.x;
            let targetY = mousePos.y + dragOffsetRef.current.y;
            targetX = Math.max(40, Math.min(1160, targetX));
            targetY = Math.max(40, Math.min(720, targetY));
            Matter.Body.setPosition(draggingBody, { x: targetX, y: targetY });
            Matter.Body.setVelocity(draggingBody, { x: 0, y: 0 });
            socket.emit('guest-drag', { id: draggingBody.id, x: targetX, y: targetY });
          }
        };

        handleGuestMouseUp = () => { 
          if (guestDraggingIdRef.current) {
            socket.emit('guest-drop', { id: guestDraggingIdRef.current }); 
            guestDraggingIdRef.current = null; 
          }
        };

        canvas.addEventListener('mousedown', handleCanvasMouseDown);
        window.addEventListener('mousemove', handleGuestMouseMove);
        window.addEventListener('mouseup', handleGuestMouseUp);
      }
    });

    socket.on('provide-initial-state', (targetId) => {
      if (!engineRef.current) return;
      const snapshotBodies = Matter.Composite.allBodies(engineRef.current.world)
        .filter(b => !b.isStatic && b.plugin && b.plugin.customType)
        .map(b => ({ id: b.id, type: b.plugin.customType, x: b.position.x, y: b.position.y, angle: b.angle, velocity: b.velocity }));
      
      const snapshotConstraints = Matter.Composite.allConstraints(engineRef.current.world)
        .filter(c => !(mouseConstraintRef.current && c === mouseConstraintRef.current.constraint))
        .map(c => ({ id: c.id, type: c.plugin?.customType || 'joint', bodyAId: c.bodyA.id, bodyBId: c.bodyB.id, length: c.length }));
        
      socket.emit('initial-state-response', { targetId, bodies: snapshotBodies, constraints: snapshotConstraints });
    });

    socket.on('sync-initial-state', (data) => {
      if (!engineRef.current) return;
      
      data.bodies.forEach(bodyData => {
        let newBody;
        if (bodyData.type === 'box') newBody = Matter.Bodies.rectangle(bodyData.x, bodyData.y, 60, 60, { restitution: 0.6, render: { fillStyle: '#3b82f6' } });
        else if (bodyData.type === 'circle') newBody = Matter.Bodies.circle(bodyData.x, bodyData.y, 30, { restitution: 0.9, render: { fillStyle: '#10b981' } });
        else if (bodyData.type === 'heavyBox') newBody = Matter.Bodies.rectangle(bodyData.x, bodyData.y, 80, 80, { density: 0.1, restitution: 0.1, render: { fillStyle: '#334155' } });
        
        if (newBody) {
          newBody.id = bodyData.id;
          newBody.plugin = { customType: bodyData.type };
          Matter.Body.setAngle(newBody, bodyData.angle);
          Matter.Body.setVelocity(newBody, bodyData.velocity);
          Matter.World.add(engineRef.current.world, newBody);
        }
      });

      data.constraints.forEach(cData => {
        const bodyA = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === cData.bodyAId);
        const bodyB = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === cData.bodyBId);
        if (bodyA && bodyB) {
          const options = { bodyA, bodyB, length: cData.length, id: cData.id, plugin: { customType: cData.type }};
          if (cData.type === 'spring') {
            options.stiffness = 0.02; options.render = { type: 'line', strokeStyle: '#FF2D55', lineWidth: 4 };
          } else {
            options.stiffness = 1; options.render = { type: 'line', strokeStyle: '#5856D6', lineWidth: 6 };
          }
          Matter.World.add(engineRef.current.world, Matter.Constraint.create(options));
        }
      });
      
      if (hudBodiesRef.current) hudBodiesRef.current.innerText = data.bodies.length;
      if (hudConstraintsRef.current) hudConstraintsRef.current.innerText = data.constraints.length;
    });

    socket.on('sync-update', (serverBodies) => {
      if (!engineRef.current) return;
      serverBodies.forEach(serverBody => {
        if (guestDraggingIdRef.current === serverBody.id) return;
        const localBody = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === serverBody.id);
        if (localBody) {
          Matter.Body.setPosition(localBody, { x: serverBody.x, y: serverBody.y });
          Matter.Body.setAngle(localBody, serverBody.angle);
          Matter.Body.setVelocity(localBody, serverBody.velocity);
        }
      });
      if (hudBodiesRef.current) hudBodiesRef.current.innerText = serverBodies.length;
    });

    socket.on('shape-spawned', (shapeData) => {
      if (!engineRef.current) return;
      let newBody;
      if (shapeData.type === 'box') newBody = Matter.Bodies.rectangle(shapeData.startX, shapeData.startY, 60, 60, { restitution: 0.6, render: { fillStyle: '#3b82f6' } });
      else if (shapeData.type === 'circle') newBody = Matter.Bodies.circle(shapeData.startX, shapeData.startY, 30, { restitution: 0.9, render: { fillStyle: '#10b981' } });
      else if (shapeData.type === 'heavyBox') newBody = Matter.Bodies.rectangle(shapeData.startX, shapeData.startY, 80, 80, { density: 0.1, restitution: 0.1, render: { fillStyle: '#334155' } });

      if (newBody) {
        newBody.id = shapeData.id;
        newBody.plugin = { customType: shapeData.type }; 
        Matter.World.add(engineRef.current.world, newBody);
      }
    });

    socket.on('constraint-spawned', (data) => {
      if (!engineRef.current) return;
      const bodyA = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === data.bodyAId);
      const bodyB = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === data.bodyBId);
      
      if (bodyA && bodyB) {
        const options = { bodyA, bodyB, length: data.length, id: data.id, plugin: { customType: data.type }};
        if (data.type === 'spring') {
          options.stiffness = 0.02; options.render = { type: 'line', strokeStyle: '#FF2D55', lineWidth: 4 };
        } else {
          options.stiffness = 1; options.render = { type: 'line', strokeStyle: '#5856D6', lineWidth: 6 };
        }
        Matter.World.add(engineRef.current.world, Matter.Constraint.create(options));
      }
    });

    socket.on('canvas-cleared', () => {
      if (!engineRef.current) return;
      const allBodies = Matter.Composite.allBodies(engineRef.current.world);
      Matter.World.remove(engineRef.current.world, allBodies.filter(b => !b.isStatic));
      
      const allConstraints = Matter.Composite.allConstraints(engineRef.current.world);
      Matter.World.remove(engineRef.current.world, allConstraints.filter(c => !(mouseConstraintRef.current && c === mouseConstraintRef.current.constraint)));
      
      guestDraggingIdRef.current = null;
      selectedBodyForConstraintRef.current = null;

      if (hudBodiesRef.current) hudBodiesRef.current.innerText = "0";
      if (hudConstraintsRef.current) hudConstraintsRef.current.innerText = "0";
    });

    // NEW: ENVIRONMENT LISTENER
    socket.on('environment-updated', (envData) => {
      if (!engineRef.current) return;
      setIsZeroG(envData.isZeroG);
      // If Zero-G, set gravity to 0. If Earth, set it back to 1.
      engineRef.current.world.gravity.y = envData.isZeroG ? 0 : 1;
    });

    return () => {
      cleanup();
      if (engineRef.current) Matter.Events.off(engineRef.current, 'afterUpdate');
      if (handleCanvasMouseDown && canvas) canvas.removeEventListener('mousedown', handleCanvasMouseDown);
      if (handleGuestMouseMove) window.removeEventListener('mousemove', handleGuestMouseMove);
      if (handleGuestMouseUp) window.removeEventListener('mouseup', handleGuestMouseUp);

      socket.disconnect(); 
      socket.off('role-assigned');
      socket.off('host-apply-guest-grab');
      socket.off('host-apply-guest-drag');
      socket.off('host-apply-guest-drop');
      socket.off('sync-update');
      socket.off('shape-spawned');
      socket.off('constraint-spawned');
      socket.off('provide-initial-state');
      socket.off('sync-initial-state');
      socket.off('canvas-cleared');
      socket.off('environment-updated');
    };
  }, []);

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim() === '') return;
    socket.emit('join-room', roomId);
    setHasJoined(true);
  };

  const handleAddShape = (type) => {
    if (!sceneRef.current) return;
    const startX = 1200 / 2 + (Math.random() * 40 - 20);
    const newId = Math.floor(Math.random() * 10000000);
    socket.emit('spawn-shape', { type, startX, startY: 100, id: newId });
  };

  const handleClearCanvas = () => {
    if (role === 'host') socket.emit('clear-canvas');
  };

  // NEW: EMIT GRAVITY CHANGE
  const handleToggleGravity = () => {
    if (role === 'host') {
      const newZeroGState = !isZeroG;
      setIsZeroG(newZeroGState);
      engineRef.current.world.gravity.y = newZeroGState ? 0 : 1;
      socket.emit('update-environment', { isZeroG: newZeroGState });
    }
  };

  return (
    <div className="flex flex-col items-center pt-8 min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-200">
      
      {/* --- JOIN MODAL (TAILWIND STYLED) --- */}
      {!hasJoined && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm transform transition-all">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Join a Lab</h2>
            <p className="text-slate-500 mb-6 text-sm">Enter a Room ID to collaborate in real-time.</p>
            <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
              <input type="text" placeholder="e.g., fluid-dynamics-101" className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-base" value={roomId} onChange={(e) => setRoomId(e.target.value)} autoFocus />
              <button type="submit" className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 text-base">Enter Workspace</button>
            </form>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="w-full max-w-[900px] mb-4 px-4">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">VIRTUAL-LAB Workspace</h1>
        <p className="text-slate-500 mt-1">Construct dynamic physics mechanisms in real-time.</p>
        {hasJoined && <p className="text-blue-600 font-bold mt-2 text-sm tracking-wide uppercase">ROOM: {roomId} &bull; ROLE: {role ? role : 'CONNECTING...'}</p>}
      </div>

      {/* --- CANVAS CONTAINER --- */}
      <div className="relative w-full max-w-[900px] aspect-[3/2] border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
        
        {/* Floating Toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-max">
          <Toolbar 
            activeTool={activeTool} 
            onSetTool={setActiveTool} 
            onAddShape={handleAddShape} 
            onClear={handleClearCanvas} 
            onToggleGravity={handleToggleGravity}
            isZeroG={isZeroG}
            isHost={role === 'host'} 
          />
        </div>

        {/* --- THE FIX: MOVED LIVE TELEMETRY HUD TO BOTTOM-LEFT --- */}
        {hasJoined && (
          <div className="absolute bottom-4 left-4 z-20 bg-white/85 backdrop-blur-md border border-slate-200/50 rounded-xl px-4 py-3 shadow-lg shadow-slate-200/50 flex flex-col gap-2 min-w-[100px] pointer-events-none">
            <div className="flex justify-between items-center gap-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bodies</span>
              <span ref={hudBodiesRef} className="text-base font-black text-slate-800 font-mono">0</span>
            </div>
            <div className="w-full h-px bg-slate-100"></div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joints</span>
              <span ref={hudConstraintsRef} className="text-base font-black text-slate-800 font-mono">0</span>
            </div>
          </div>
        )}

        {/* Matter.js Render Target */}
        <div ref={sceneRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default PhysicsCanvas;