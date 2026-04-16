import { useEffect, useRef } from 'react';
import { initPhysics } from '../physics/engineSetup';

const PhysicsCanvas = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null); // Useful later for adding new objects via UI

  useEffect(() => {
    if (!sceneRef.current) return;

    // Initialize physics
    const { engine, cleanup } = initPhysics(sceneRef);
    engineRef.current = engine;

    // Strict cleanup function (crucial because React Strict Mode runs useEffect twice in dev)
    return () => {
      cleanup();
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-slate-200 p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl mb-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          VIRTUAL-LAB Workspace
        </h1>
        {/* Placeholder for toolbar */}
        <div className="px-4 py-2 bg-white rounded shadow text-sm font-medium">
          Toolbar area
        </div>
      </div>

      {/* The container where Matter.js will inject the canvas */}
      <div 
        ref={sceneRef} 
        className="w-full max-w-6xl h-[70vh] border border-slate-300 rounded-xl shadow-lg overflow-hidden bg-white"
      />
    </div>
  );
};

export default PhysicsCanvas;