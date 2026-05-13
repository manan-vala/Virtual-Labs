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
            if (hudBodiesRef.current) {
              hudBodiesRef.current.innerText = allBodies.filter(b => !b.isStatic).length;
            }
            if (hudConstraintsRef.current) {
              // THE BUG FIX: Bulletproof constraint counting. Total constraints minus the Mouse.
              const activeConstraints = allConstraints.filter(c => {
                return !(mouseConstraintRef.current && c === mouseConstraintRef.current.constraint);
              });
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

                  socket.emit('spawn-constraint', {
                    id: newConstraintId,
                    type: activeToolRef.current,
                    bodyAId: bodyA.id,
                    bodyBId: body.id,
                    length: constraintLength
                  });
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
        .filter(c => {
           return !(mouseConstraintRef.current && c === mouseConstraintRef.current.constraint);
        })
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
            options.stiffness = 0.02;
            options.render = { type: 'line', strokeStyle: '#FF2D55', lineWidth: 4 };
          } else {
            options.stiffness = 1;
            options.render = { type: 'line', strokeStyle: '#5856D6', lineWidth: 6 };
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
          options.stiffness = 0.02;
          options.render = { type: 'line', strokeStyle: '#FF2D55', lineWidth: 4 };
        } else {
          options.stiffness = 1; 
          options.render = { type: 'line', strokeStyle: '#5856D6', lineWidth: 6 };
        }
        Matter.World.add(engineRef.current.world, Matter.Constraint.create(options));
      }
    });

    socket.on('canvas-cleared', () => {
      if (!engineRef.current) return;
      
      const allBodies = Matter.Composite.allBodies(engineRef.current.world);
      const dynamicBodies = allBodies.filter(b => !b.isStatic);
      Matter.World.remove(engineRef.current.world, dynamicBodies);
      
      const allConstraints = Matter.Composite.allConstraints(engineRef.current.world);
      const constraintsToRemove = allConstraints.filter(c => {
        const isMouseConstraint = mouseConstraintRef.current && c === mouseConstraintRef.current.constraint;
        return !isMouseConstraint; 
      });
      Matter.World.remove(engineRef.current.world, constraintsToRemove);
      
      guestDraggingIdRef.current = null;
      selectedBodyForConstraintRef.current = null;

      if (hudBodiesRef.current) hudBodiesRef.current.innerText = "0";
      if (hudConstraintsRef.current) hudConstraintsRef.current.innerText = "0";
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2rem', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      {!hasJoined && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1.25rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', width: '100%', maxWidth: '24rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#0f172a', marginTop: 0 }}>Join a Lab</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Enter a Room ID to collaborate in real-time.</p>
            <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" placeholder="e.g., fluid-dynamics-101" style={{ padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.75rem', outline: 'none', fontSize: '1rem' }} value={roomId} onChange={(e) => setRoomId(e.target.value)} autoFocus />
              <button type="submit" style={{ padding: '0.75rem 1rem', backgroundColor: '#007AFF', color: 'white', fontWeight: 'bold', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>Enter Workspace</button>
            </form>
          </div>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '900px', marginBottom: '1rem', padding: '0 1rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>VIRTUAL-LAB Workspace</h1>
        <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Construct dynamic physics mechanisms in real-time.</p>
        {hasJoined && <p style={{ color: '#007AFF', fontWeight: 'bold', marginTop: '0.5rem', fontSize: '0.875rem', letterSpacing: '0.05em' }}>ROOM: {roomId} &bull; ROLE: {role ? role.toUpperCase() : 'CONNECTING...'}</p>}
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '900px', aspectRatio: '3 / 2', border: '1px solid #e2e8f0', borderRadius: '1.5rem', overflow: 'hidden', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        
        {/* Top Centered Controls */}
        <div style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <Toolbar activeTool={activeTool} onSetTool={setActiveTool} onAddShape={handleAddShape} onClear={handleClearCanvas} isHost={role === 'host'} />
        </div>

        {/* --- THE LIVE TELEMETRY HUD (COMPACT & CLICK-THROUGH) --- */}
        {hasJoined && (
          <div style={{
            position: 'absolute', bottom: '1rem', left: '1rem', zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 0, 0, 0.05)', borderRadius: '0.75rem', 
            padding: '0.5rem 0.75rem', /* Smaller padding */
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
            display: 'flex', flexDirection: 'column', gap: '0.5rem', /* Tighter gap */
            minWidth: '90px', /* Slimmer width */
            pointerEvents: 'none' /* THE MAGIC FIX: Clicks pass right through it! */
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bodies</span>
              <span ref={hudBodiesRef} style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>0</span>
            </div>
            <div style={{ width: '100%', height: '1px', backgroundColor: '#e2e8f0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Joints</span>
              <span ref={hudConstraintsRef} style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>0</span>
            </div>
          </div>
        )}

        <div ref={sceneRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

export default PhysicsCanvas;