const Toolbar = ({ onAddShape }) => {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
      {/* Frosted glass container */}
      <div className="flex items-center gap-4 px-6 py-3 bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl">
        <span className="text-sm font-semibold text-slate-600 mr-2">Spawn:</span>
        
        <button 
          onClick={() => onAddShape('box')}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          Box
        </button>
        
        <button 
          onClick={() => onAddShape('circle')}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          Circle
        </button>

        <div className="w-px h-6 bg-slate-300 mx-2"></div>

        <button 
          onClick={() => onAddShape('heavyBox')}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          Heavy Anvil
        </button>
      </div>
    </div>
  );
};

export default Toolbar;