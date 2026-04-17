import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { initPhysics } from '../physics/engineSetup';
import Toolbar from './Toolbar';
import { socket } from '/sockets/socketManager'; 

const PhysicsCanvas = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  
  // New State for Room Management
  const [roomId, setRoomId] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (!sceneRef.current) return;

    socket.connect();
    
    socket.on('connect', () => {
      console.log('Connected to server with ID:', socket.id);
    });

    const { engine, cleanup } = initPhysics(sceneRef);
    engineRef.current = engine;

    return () => {
      cleanup();
      socket.disconnect(); 
      socket.off('connect');
    };
  }, []);

  // Handle form submission for the modal
  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim() === '') return;
    
    // Tell the backend to put us in this specific room
    socket.emit('join-room', roomId);
    setHasJoined(true);
  };

  const handleAddShape = (type) => {
    if (!engineRef.current) return;
    
    const world = engineRef.current.world;
    const renderWidth = sceneRef.current.clientWidth;
    
    const startX = renderWidth / 2 + (Math.random() * 40 - 20);
    const startY = 100;
    
    let newBody;

    if (type === 'box') {
      newBody = Matter.Bodies.rectangle(startX, startY, 60, 60, {
        restitution: 0.6,
        render: { fillStyle: '#3b82f6' }
      });
    } 
    else if (type === 'circle') {
      newBody = Matter.Bodies.circle(startX, startY, 30, {
        restitution: 0.9,
        render: { fillStyle: '#10b981' }
      });
    }
    else if (type === 'heavyBox') {
      newBody = Matter.Bodies.rectangle(startX, startY, 80, 80, {
        density: 0.1,
        restitution: 0.1,
        render: { fillStyle: '#334155' }
      });
    }

    if (newBody) {
      Matter.World.add(world, newBody);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-slate-100 flex flex-col items-center pt-8">
      
      {/* The Join Room Modal Overlay */}
      {!hasJoined && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-md">
          <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold mb-2 text-slate-800 tracking-tight">Join a Lab</h2>
            <p className="text-slate-500 mb-6 text-sm">Enter a Room ID to collaborate in real-time.</p>
            
            <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="e.g., fluid-dynamics-101"
                className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-md"
              >
                Enter Workspace
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl mb-4 px-4">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          VIRTUAL-LAB Workspace {hasJoined && <span className="text-blue-500 text-lg ml-2 border border-blue-200 bg-blue-50 px-2 py-1 rounded-md">{roomId}</span>}
        </h1>
        <p className="text-slate-500 mt-1">Drag objects with your mouse. Add bodies below.</p>
      </div>

      <div 
        ref={sceneRef} 
        className="relative w-full max-w-6xl h-[75vh] border border-slate-300 rounded-2xl shadow-sm overflow-hidden bg-white"
      >
        <Toolbar onAddShape={handleAddShape} />
      </div>
    </div>
  );
};

export default PhysicsCanvas;