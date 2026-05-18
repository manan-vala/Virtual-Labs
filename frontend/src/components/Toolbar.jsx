import { useState } from 'react';

const TOOL_COLORS = {
  pointer: 'var(--accent)',
  joint:   'var(--violet)',
  spring:  'var(--rose)',
};

const TLabel = ({ children }) => (
  <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--td)',
    textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 4px' }}>
    {children}
  </span>
);

const TDiv = () => (
  <div style={{ width: 1, height: 18, background: 'var(--b)', margin: '0 3px' }} />
);

const Toolbar = ({ activeTool, onSetTool, onAddShape, onClear, onToggleGravity, onOpenLibrary, isZeroG, isHost }) => {
  const [hov, setHov] = useState(null);

  const MBtn = ({ id, label }) => {
    const active = activeTool === id;
    return (
      <button
        onClick={() => onSetTool(id)}
        onMouseEnter={() => setHov(id)}
        onMouseLeave={() => setHov(null)}
        style={{
          padding: '5px 12px', borderRadius: 7, border: 'none',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.02em',
          transition: 'all 0.13s',
          background: active ? TOOL_COLORS[id] : hov === id ? 'var(--s2)' : 'transparent',
          color: active ? '#fff' : hov === id ? 'var(--t)' : 'var(--tm)',
          boxShadow: active ? `0 2px 10px color-mix(in srgb, ${TOOL_COLORS[id]} 40%, transparent)` : 'none',
        }}>
        {label}
      </button>
    );
  };

  const SBtn = ({ id, label }) => (
    <button
      onClick={() => onAddShape(id)}
      onMouseEnter={() => setHov('s' + id)}
      onMouseLeave={() => setHov(null)}
      style={{
        padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 500,
        cursor: 'pointer', border: '1px solid var(--b)', transition: 'all 0.13s',
        background: hov === 's' + id ? 'var(--s2)' : 'transparent',
        color: hov === 's' + id ? 'var(--t)' : 'var(--tm)',
      }}>
      {label}
    </button>
  );

  return (
    <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 40,
      display: 'flex', alignItems: 'center', gap: 3,
      background: 'rgba(11,18,32,0.93)', border: '1px solid var(--bh)',
      borderRadius: 12, padding: '5px 8px',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.55)', whiteSpace: 'nowrap' }}>

      <TLabel>MODE</TLabel>
      <MBtn id="pointer" label="Drag" />
      <MBtn id="joint"   label="Joint" />
      <MBtn id="spring"  label="Spring" />

      <TDiv />
      <TLabel>SPAWN</TLabel>
      <SBtn id="box"      label="Box" />
      <SBtn id="circle"   label="Circle" />
      <SBtn id="heavyBox" label="Anvil" />

      {isHost && (
        <>
          <TDiv />

          <button
            onClick={onToggleGravity}
            onMouseEnter={() => setHov('g')}
            onMouseLeave={() => setHov(null)}
            style={{
              padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.13s',
              border: isZeroG ? '1px solid oklch(0.68 0.18 280 / 0.45)' : '1px solid var(--b)',
              background: isZeroG ? 'oklch(0.68 0.18 280 / 0.13)' : hov === 'g' ? 'var(--s2)' : 'transparent',
              color: isZeroG ? 'var(--violet)' : 'var(--tm)',
            }}>
            {isZeroG ? 'Zero-G' : 'Earth G'}
          </button>

          <button
            onClick={onOpenLibrary}
            onMouseEnter={() => setHov('lib')}
            onMouseLeave={() => setHov(null)}
            style={{
              padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.13s',
              border: '1px solid oklch(0.72 0.18 155 / 0.32)',
              background: hov === 'lib' ? 'oklch(0.72 0.18 155 / 0.16)' : 'oklch(0.72 0.18 155 / 0.07)',
              color: 'var(--green)',
            }}>
            Library
          </button>

          <button
            onClick={onClear}
            onMouseEnter={() => setHov('clr')}
            onMouseLeave={() => setHov(null)}
            style={{
              padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.13s',
              border: '1px solid oklch(0.65 0.22 355 / 0.28)',
              background: hov === 'clr' ? 'oklch(0.65 0.22 355 / 0.12)' : 'transparent',
              color: hov === 'clr' ? 'var(--rose)' : 'var(--td)',
            }}>
            Clear
          </button>
        </>
      )}
    </div>
  );
};

export default Toolbar;
