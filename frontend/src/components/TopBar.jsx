import { useState, useEffect } from 'react';

function Chip({ label, value, valueColor, dot }) {
  return (
    <div style={{ padding: '3px 10px', background: 'var(--s2)', border: '1px solid var(--b)',
      borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--td)',
        textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      {dot && <div style={{ width: 5, height: 5, borderRadius: '50%', background: valueColor, flexShrink: 0 }} />}
      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: valueColor }}>
        {value}
      </span>
    </div>
  );
}

export default function TopBar({ roomId, role, onOpenTweaks }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 18px', background: 'rgba(7,9,14,0.97)',
      borderBottom: '1px solid var(--b)', flexShrink: 0, zIndex: 50 }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 26, height: 26, background: 'var(--accent)', borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: '#000', fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '-0.02em' }}>VL</div>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em' }}>VIRTUAL LAB</span>
      </div>

      {/* Status chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Chip label="ROOM" value={roomId} valueColor="var(--accent)" />
        <Chip label="ROLE" value={role ? role.toUpperCase() : 'CONNECTING'}
          valueColor={role === 'host' ? 'var(--green)' : 'var(--amber)'} dot />
        <Chip label="SESSION" value={fmt(elapsed)} valueColor="var(--tm)" />
      </div>

      {/* Settings button */}
      <button
        onClick={onOpenTweaks}
        title="Open Tweaks"
        style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--b)',
          background: 'transparent', color: 'var(--tm)', fontSize: 15,
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--s2)'; e.currentTarget.style.color = 'var(--t)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--tm)'; }}>
        ⚙
      </button>
    </div>
  );
}
