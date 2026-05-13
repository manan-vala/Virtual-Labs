const Toolbar = ({ activeTool, onSetTool, onAddShape, onClear, isHost }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1rem' }}>
      
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem',
        backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(0, 0, 0, 0.05)', 
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        borderRadius: '1.25rem'
      }}>
        
        {/* --- TOOLS SECTION --- */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold', color: '#94a3b8', marginRight: '0.25rem' }}>Mode</span>
          
          <button onClick={() => onSetTool('pointer')} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '600', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeTool === 'pointer' ? '#007AFF' : 'transparent', color: activeTool === 'pointer' ? 'white' : '#475569' }}>👆 Drag</button>
          <button onClick={() => onSetTool('joint')} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '600', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeTool === 'joint' ? '#5856D6' : 'transparent', color: activeTool === 'joint' ? 'white' : '#475569' }}>🔗 Rigid Joint</button>
          <button onClick={() => onSetTool('spring')} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '600', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeTool === 'spring' ? '#FF2D55' : 'transparent', color: activeTool === 'spring' ? 'white' : '#475569' }}>〰️ Spring</button>
        </div>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0', margin: '0 0.25rem' }}></div>

        {/* --- SPAWN SECTION --- */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold', color: '#94a3b8', marginRight: '0.25rem' }}>Spawn</span>
          
          <button onClick={() => onAddShape('box')} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '600', backgroundColor: '#f1f5f9', color: '#0f172a', borderRadius: '0.75rem', border: '1px solid #e2e8f0', cursor: 'pointer' }}>Box</button>
          <button onClick={() => onAddShape('circle')} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '600', backgroundColor: '#f1f5f9', color: '#0f172a', borderRadius: '0.75rem', border: '1px solid #e2e8f0', cursor: 'pointer' }}>Circle</button>
          <button onClick={() => onAddShape('heavyBox')} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '600', backgroundColor: '#334155', color: 'white', borderRadius: '0.75rem', border: 'none', cursor: 'pointer' }}>Anvil</button>
        </div>

        {/* --- HOST CONTROLS --- */}
        {isHost && (
          <>
            <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0', margin: '0 0.25rem' }}></div>
            <button 
              onClick={onClear} 
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 'bold', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '0.75rem', border: '1px solid #fecaca', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
            >
              🗑️ Clear Lab
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default Toolbar;