const Toolbar = ({ activeTool, onSetTool, onAddShape, onClear, onToggleGravity, onOpenLibrary, isZeroG, isHost }) => {
  return (
    <div className="w-full flex justify-center">
      <div className="flex flex-wrap justify-center items-center gap-y-3 gap-x-4 px-6 py-3 bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-sm rounded-2xl w-full max-w-fit">
        
        {/* --- MODES --- */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Mode</span>
          <button onClick={() => onSetTool('pointer')} className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTool === 'pointer' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'text-slate-600 hover:bg-slate-100'}`}>👆 Drag</button>
          <button onClick={() => onSetTool('joint')} className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTool === 'joint' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30' : 'text-slate-600 hover:bg-slate-100'}`}>🔗 Joint</button>
          <button onClick={() => onSetTool('spring')} className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTool === 'spring' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'text-slate-600 hover:bg-slate-100'}`}>〰️ Spring</button>
        </div>

        {/* --- SPAWN --- */}
        <div className="hidden md:block w-px h-6 bg-slate-200 mx-1"></div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Spawn</span>
          <button onClick={() => onAddShape('box')} className="px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-800 rounded-xl hover:bg-slate-200 transition-colors">Box</button>
          <button onClick={() => onAddShape('circle')} className="px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-800 rounded-xl hover:bg-slate-200 transition-colors">Circle</button>
          <button onClick={() => onAddShape('heavyBox')} className="px-4 py-2 text-sm font-semibold bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-md shadow-slate-700/20">Anvil</button>
        </div>

        {/* --- HOST CONTROLS --- */}
        {isHost && (
          <>
            <div className="hidden md:block w-px h-6 bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Lab</span>
              
              {/* THE MISSING LIBRARY BUTTON */}
              <button onClick={onOpenLibrary} className="px-4 py-2 text-sm font-semibold bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100">
                📚 Library
              </button>
              
              <button onClick={onToggleGravity} className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${isZeroG ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {isZeroG ? '🌌 Zero-G' : '🌍 Earth Gravity'}
              </button>
              <button onClick={onClear} className="px-4 py-2 text-sm font-semibold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors border border-red-100">
                🗑️ Clear
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Toolbar;