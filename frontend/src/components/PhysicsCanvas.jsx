import { useEffect, useRef, useState, useMemo } from 'react';
import Matter from 'matter-js';
import { initPhysics } from '../physics/engineSetup';
import Toolbar from './Toolbar';
import TopBar from './TopBar';
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from './TweaksPanel';
import { socket } from '/sockets/socketManager';

/* ─── Join Screen ─────────────────────────────────────────────────────────── */
function JoinScreen({ onJoin }) {
  const [roomId, setRoomId] = useState('');
  const [role, setRole] = useState('host');
  const [focused, setFocused] = useState(false);

  const particles = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: 20 + Math.random() * 80,
    s: Math.random() * 1.8 + 0.6,
    dur: 7 + Math.random() * 9,
    delay: Math.random() * 12,
    dx: (Math.random() - 0.5) * 48,
  })), []);

  const go = () => { if (roomId.trim()) onJoin(roomId.trim()); };

  const roleAccent = { host: 'var(--green)', guest: 'var(--accent)' };
  const roleBg    = { host: 'oklch(0.72 0.18 155 / 0.12)', guest: 'oklch(0.72 0.2 218 / 0.12)' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', overflow: 'hidden' }}>

      {/* dot grid */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(100,150,215,0.14) 1px, transparent 1px)',
        backgroundSize: '30px 30px' }} />

      {/* radial glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)', width: 520, height: 520,
        borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, oklch(0.72 0.2 218 / 0.055) 0%, transparent 70%)' }} />

      {/* particles */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
          width: p.s, height: p.s, borderRadius: '50%',
          background: 'var(--accent)', opacity: 0,
          animation: `floatUp ${p.dur}s ${p.delay}s infinite ease-out`,
          '--dx': `${p.dx}px`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* card */}
      <div style={{ position: 'relative', background: 'var(--surface)', border: '1px solid var(--bh)',
        padding: '38px 38px 32px', width: '100%', maxWidth: 380,
        boxShadow: '0 32px 80px rgba(0,0,0,0.62)', animation: 'slideUp 0.35s ease', borderRadius: 4 }}>

        {/* logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
          <div style={{ width: 38, height: 38, background: 'var(--accent)', borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#000', fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '-0.02em' }}>VL</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.05em' }}>VIRTUAL LAB</div>
            <div style={{ fontSize: 10, color: 'var(--td)', fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.09em' }}>2D PHYSICS SANDBOX</div>
          </div>
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 7 }}>Enter Lab Session</div>
        <div style={{ fontSize: 13, color: 'var(--tm)', marginBottom: 26, lineHeight: 1.65 }}>
          Join a collaborative workspace with your class.
        </div>

        {/* role toggle (cosmetic — server assigns host/guest by join order) */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--td)',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>JOIN AS</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['host', 'guest'].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{
                flex: 1, padding: '8px', borderRadius: 9, cursor: 'pointer',
                border: `1px solid ${role === r ? roleAccent[r] : 'var(--b)'}`,
                background: role === r ? roleBg[r] : 'transparent',
                color: role === r ? roleAccent[r] : 'var(--tm)',
                fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', transition: 'all 0.15s',
              }}>{r}</button>
            ))}
          </div>
        </div>

        {/* room id */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--td)',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>ROOM ID</div>
          <input
            type="text" value={roomId} autoFocus
            onChange={e => setRoomId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && go()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="e.g. phys-101"
            style={{
              width: '100%', background: 'var(--s2)', outline: 'none',
              border: `1px solid ${focused ? 'var(--accent)' : 'var(--b)'}`,
              boxShadow: focused ? '0 0 0 3px oklch(0.72 0.2 218 / 0.13)' : 'none',
              borderRadius: 10, padding: '12px 14px', color: 'var(--t)', fontSize: 14,
              fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em', transition: 'all 0.15s',
            }} />
        </div>

        <button
          onClick={go}
          style={{ width: '100%', padding: '13px', background: 'var(--accent)', border: 'none',
            borderRadius: 10, color: '#000', fontSize: 13, fontWeight: 700, letterSpacing: '0.02em',
            opacity: roomId.trim() ? 1 : 0.42, transition: 'opacity 0.15s, filter 0.15s', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.filter = ''; }}>
          Enter Workspace →
        </button>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 10, color: 'var(--td)',
          fontFamily: 'JetBrains Mono, monospace' }}>
          VIRTUAL LAB v2.1 · Physics Edition
        </div>
      </div>
    </div>
  );
}

/* ─── HUD Overlay ─────────────────────────────────────────────────────────── */
function HUD({ bodiesRef, constraintsRef, isZeroG }) {
  const row = (label, ref, color = 'var(--t)') => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 22 }}>
      <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--td)',
        textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      <span ref={ref} style={{ fontSize: 15, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color }}>0</span>
    </div>
  );

  return (
    <div style={{ position: 'absolute', bottom: 14, left: 14, pointerEvents: 'none',
      background: 'rgba(11,18,32,0.88)', border: '1px solid var(--b)',
      borderRadius: 11, padding: '10px 14px', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
      {row('BODIES', bodiesRef)}
      <div style={{ height: 1, background: 'var(--b)', margin: '6px 0' }} />
      {row('JOINTS', constraintsRef)}
      {isZeroG && (
        <>
          <div style={{ height: 1, background: 'var(--b)', margin: '6px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 22 }}>
            <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--td)',
              textTransform: 'uppercase', letterSpacing: '0.1em' }}>GRAVITY</span>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--violet)' }}>0.00</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Body Inspector ──────────────────────────────────────────────────────── */
function BodyInspector({ body, onClose }) {
  if (!body) return null;
  const fields = [
    ['TYPE',  body.type],
    ['MASS',  `${body.mass.toFixed(1)} kg`],
    ['Vx',   `${body.vx} m/s`],
    ['Vy',   `${body.vy} m/s`],
    ['KE',   `${body.ke} J`],
  ];
  return (
    <div style={{ position: 'absolute', bottom: 14, right: 14,
      background: 'rgba(11,18,32,0.92)', border: '1px solid var(--bh)',
      borderRadius: 12, padding: '12px 14px', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      minWidth: 168, animation: 'slideUp 0.14s ease', zIndex: 30 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)',
          textTransform: 'uppercase', letterSpacing: '0.1em' }}>BODY #{body.id}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--td)',
          fontSize: 12, cursor: 'pointer', padding: 0, lineHeight: 1 }}>✕</button>
      </div>
      {fields.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 5 }}>
          <span style={{ fontSize: 10, color: 'var(--td)', fontFamily: 'JetBrains Mono, monospace',
            textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</span>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--t)' }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Energy Chart (custom SVG, smooth bezier) ────────────────────────────── */
function EnergyChart({ data }) {
  if (data.length < 2) return (
    <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 10, color: 'var(--td)', fontFamily: 'JetBrains Mono, monospace' }}>
        Awaiting data…
      </span>
    </div>
  );
  const W = 232, H = 88;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - (v / max) * H * 0.88 - 2,
  ]);

  // Smooth cubic bezier path through midpoints
  let linePath = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const cpx = (x0 + x1) / 2;
    linePath += ` C ${cpx},${y0} ${cpx},${y1} ${x1},${y1}`;
  }
  const areaPath = `${linePath} L ${pts[pts.length - 1][0]},${H} L ${pts[0][0]},${H} Z`;
  const [dotX, dotY] = pts[pts.length - 1];

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="vlcg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#vlcg)" />
      <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="1.8"
        strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={dotX} cy={dotY} r="3" fill="var(--accent)" />
    </svg>
  );
}

/* ─── Analytics Panel ─────────────────────────────────────────────────────── */
function AnalyticsPanel({ chartData, bodyCount, jointCount }) {
  const data = chartData.map(d => d.energy);
  const last  = data[data.length - 1] || 0;
  const prev  = data[data.length - 2] || 0;
  const delta = last - prev;
  const peak  = data.length ? Math.max(...data) : 0;
  const avg   = data.length ? Math.round(data.reduce((a, b) => a + b, 0) / data.length) : 0;

  const stats = [
    { l: 'BODIES', v: bodyCount, c: 'var(--accent)' },
    { l: 'JOINTS', v: jointCount, c: 'var(--violet)' },
    { l: 'PEAK KE', v: peak, u: 'J', c: 'var(--amber)' },
    { l: 'AVG KE',  v: avg,  u: 'J', c: 'var(--tm)' },
  ];

  return (
    <div style={{ width: 264, flexShrink: 0, background: 'var(--surface)',
      borderLeft: '1px solid var(--b)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--b)' }}>
        <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--td)',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>ANALYTICS</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Kinetic Energy</div>
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--b)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ fontSize: 30, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{last}</span>
          <span style={{ fontSize: 12, color: 'var(--tm)', fontFamily: 'JetBrains Mono, monospace' }}>J</span>
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', marginLeft: 'auto',
            color: delta > 0 ? 'var(--green)' : delta < 0 ? 'var(--rose)' : 'var(--td)' }}>
            {delta >= 0 ? '+' : ''}{delta}J
          </span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--td)', marginTop: 2 }}>½mv² across {bodyCount} bodies</div>
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--b)' }}>
        <EnergyChart data={data} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 9, color: 'var(--td)', fontFamily: 'JetBrains Mono, monospace' }}>−{data.length * 0.5}s</span>
          <span style={{ fontSize: 9, color: 'var(--td)', fontFamily: 'JetBrains Mono, monospace' }}>now</span>
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {stats.map(s => (
          <div key={s.l} style={{ background: 'var(--s2)', borderRadius: 8, padding: '8px 10px',
            border: '1px solid var(--b)' }}>
            <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', color: 'var(--td)',
              textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>{s.l}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: s.c }}>{s.v}</span>
              {s.u && <span style={{ fontSize: 10, color: 'var(--td)', fontFamily: 'JetBrains Mono, monospace' }}>{s.u}</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ margin: '0 16px 16px', padding: '10px 12px', background: 'var(--s2)',
        borderRadius: 10, border: '1px solid var(--b)' }}>
        <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--td)',
          textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6 }}>BODY INSPECTOR</div>
        <div style={{ fontSize: 11, color: 'var(--td)', textAlign: 'center', padding: '5px 0', fontStyle: 'italic' }}>
          Click a body to inspect
        </div>
      </div>
    </div>
  );
}

/* ─── Library Modal ───────────────────────────────────────────────────────── */
function LibraryModal({ isHost, experiments, newExpName, setNewExpName, onSave, onLoad, onDelete, onClose }) {
  const [tab, setTab]     = useState('all');
  const [hov, setHov]     = useState(null);
  const [focused, setFocused] = useState(false);

  const typeOf = exp => {
    if (!exp.constraints || exp.constraints.length === 0) return 'none';
    const types = exp.constraints.map(c => c.type || 'joint');
    return types.includes('spring') ? 'spring' : 'joint';
  };

  const filtered = tab === 'all' ? experiments
    : experiments.filter(e => typeOf(e) === tab.slice(0, -1));

  const tabs = ['all', 'joints', 'springs'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.74)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--bh)', borderRadius: 18,
        width: '100%', maxWidth: 580, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', animation: 'modalIn 0.2s ease', boxShadow: '0 32px 90px rgba(0,0,0,0.7)' }}>

        {/* header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--b)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--td)',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>EXPERIMENT LIBRARY</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{experiments.length} saved templates</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%',
            border: '1px solid var(--b)', background: 'transparent', color: 'var(--tm)',
            fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        </div>

        {/* save form (host only) */}
        {isHost && (
          <form onSubmit={onSave} style={{ padding: '12px 22px', borderBottom: '1px solid var(--b)',
            display: 'flex', gap: 10 }}>
            <input
              type="text" value={newExpName}
              onChange={e => setNewExpName(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Name this experiment…"
              style={{ flex: 1, background: 'var(--s2)', outline: 'none',
                border: `1px solid ${focused ? 'var(--accent)' : 'var(--b)'}`,
                borderRadius: 8, padding: '8px 12px', color: 'var(--t)', fontSize: 13,
                fontFamily: 'Space Grotesk, sans-serif', transition: 'all 0.15s' }} />
            <button type="submit" style={{ padding: '8px 18px', background: 'var(--green)', border: 'none',
              borderRadius: 8, color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Save Lab
            </button>
          </form>
        )}

        {/* tabs */}
        <div style={{ display: 'flex', padding: '0 22px', borderBottom: '1px solid var(--b)' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 14px', border: 'none', borderRadius: 0, background: 'transparent',
              cursor: 'pointer', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.07em', transition: 'all 0.13s',
              borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
              color: tab === t ? 'var(--accent)' : 'var(--td)',
            }}>{t}</button>
          ))}
        </div>

        {/* list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 22px',
          display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--td)', fontSize: 12,
              fontStyle: 'italic', padding: '24px 0' }}>
              {experiments.length === 0
                ? 'No experiments saved yet. Build something and save it!'
                : 'No experiments in this category.'}
            </p>
          )}
          {filtered.map(exp => {
            const t = typeOf(exp);
            const on = hov === exp.id;
            return (
              <div key={exp.id}
                onMouseEnter={() => setHov(exp.id)}
                onMouseLeave={() => setHov(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                  background: on ? 'var(--s2)' : 'transparent',
                  border: `1px solid ${on ? 'var(--bh)' : 'var(--b)'}`,
                  borderRadius: 10, transition: 'all 0.15s' }}>

                <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                  background: t === 'spring' ? 'oklch(0.65 0.22 355 / 0.1)' : 'oklch(0.68 0.18 280 / 0.1)',
                  border: `1px solid ${t === 'spring' ? 'oklch(0.65 0.22 355 / 0.28)' : 'oklch(0.68 0.18 280 / 0.28)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, color: t === 'spring' ? 'var(--rose)' : 'var(--violet)' }}>
                  {t === 'spring' ? '〰' : '⬡'}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{exp.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--td)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {exp.bodies?.length ?? 0} bodies · {exp.constraints?.length ?? 0} joints
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => onLoad(exp)} style={{ padding: '5px 12px', borderRadius: 6,
                    cursor: 'pointer', border: '1px solid oklch(0.72 0.2 218 / 0.3)',
                    background: 'oklch(0.72 0.2 218 / 0.08)',
                    color: 'var(--accent)', fontSize: 11, fontWeight: 600 }}>Load</button>
                  {isHost && (
                    <button onClick={() => onDelete(exp.id)} style={{ padding: '5px 10px', borderRadius: 6,
                      cursor: 'pointer', border: '1px solid var(--b)', background: 'transparent',
                      color: 'var(--td)', fontSize: 11 }}>✕</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Hint Bar ────────────────────────────────────────────────────────────── */
const HINTS = {
  pointer: 'CLICK BODIES TO INSPECT · DRAG TO MOVE',
  joint:   'CLICK TWO BODIES TO CREATE A RIGID JOINT',
  spring:  'CLICK TWO BODIES TO CONNECT WITH A SPRING',
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const PhysicsCanvas = () => {
  const sceneRef     = useRef(null);
  const engineRef    = useRef(null);
  const runnerRef    = useRef(null);
  const mouseConstraintRef = useRef(null);
  const physicsRef   = useRef(null);

  const guestDraggingIdRef = useRef(null);
  const dragOffsetRef      = useRef({ x: 0, y: 0 });
  const hudBodiesRef       = useRef(null);
  const hudConstraintsRef  = useRef(null);

  const [activeTool, setActiveTool] = useState('pointer');
  const activeToolRef = useRef(activeTool);
  const selectedBodyForConstraintRef = useRef(null);

  const [roomId,    setRoomId]    = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [role,      setRole]      = useState(null);
  const [isZeroG,   setIsZeroG]   = useState(false);
  const [chartData, setChartData] = useState([]);
  const lastChartUpdateRef = useRef(Date.now());

  const [bodyCount,  setBodyCount]  = useState(0);
  const [jointCount, setJointCount] = useState(0);

  const [isLibraryOpen,    setIsLibraryOpen]    = useState(false);
  const [newExpName,       setNewExpName]        = useState('');
  const [savedExperiments, setSavedExperiments]  = useState([]);

  const [selectedBodyId,   setSelectedBodyId]   = useState(null);
  const [selectedBodyData, setSelectedBodyData] = useState(null);
  const [showTweaks,       setShowTweaks]       = useState(false);

  const TWEAK_DEFAULTS = { showAnalytics: true, scheme: 'sci-dark' };
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    document.documentElement.setAttribute('data-scheme', t.scheme);
    if (physicsRef.current) physicsRef.current.setScheme(t.scheme);
  }, [t.scheme]);

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
    const physics = initPhysics(sceneRef);
    physicsRef.current = physics;
    const { engine, runner, mouseConstraint, cleanup } = physics;
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
          const allBodies      = Matter.Composite.allBodies(engineRef.current.world);
          const allConstraints = Matter.Composite.allConstraints(engineRef.current.world);
          const now = Date.now();

          if (engineRef.current.timing.timestamp % 10 < 2) {
            const bc = allBodies.filter(b => !b.isStatic).length;
            const jc = allConstraints.filter(c => !(mouseConstraintRef.current && c === mouseConstraintRef.current.constraint)).length;
            if (hudBodiesRef.current)      hudBodiesRef.current.innerText = bc;
            if (hudConstraintsRef.current) hudConstraintsRef.current.innerText = jc;
          }

          if (now - lastChartUpdateRef.current > 150) {
            let totalKE = 0;
            allBodies.forEach(b => {
              if (!b.isStatic && !b.isGuestDragging) {
                totalKE += 0.5 * b.mass * (b.velocity.x ** 2 + b.velocity.y ** 2);
              }
            });
            const bc = allBodies.filter(b => !b.isStatic).length;
            const jc = allConstraints.filter(c => !(mouseConstraintRef.current && c === mouseConstraintRef.current.constraint)).length;
            setBodyCount(bc);
            setJointCount(jc);
            setChartData(prev => {
              const entry = {
                time: new Date().toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' }),
                energy: Math.round(totalKE),
              };
              return [...prev, entry].slice(-40);
            });
            lastChartUpdateRef.current = now;
          }

          allBodies.forEach(b => {
            if (b.isGuestDragging) {
              Matter.Body.setVelocity(b, { x: 0, y: 0 });
              Matter.Body.setAngularVelocity(b, 0);
              b.force = { x: 0, y: 0 };
            }
          });
          socket.emit('physics-sync', allBodies
            .filter(b => !b.isStatic || b.isGuestDragging)
            .map(b => ({ id: b.id, x: b.position.x, y: b.position.y, angle: b.angle, velocity: b.velocity })));
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
          if (body) { body.isGuestDragging = false; Matter.Body.set(body, 'isSleeping', false); }
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
            y: (e.clientY - rect.top)  * (800  / rect.height),
          };
        };

        handleCanvasMouseDown = (e) => {
          const mousePos = getLogicalMouse(e);
          const clicked = Matter.Query.point(
            Matter.Composite.allBodies(engineRef.current.world).filter(b => !b.isStatic),
            mousePos
          );

          if (clicked.length > 0) {
            const body = clicked[0];

            // Capture body snapshot for inspector
            setSelectedBodyId(body.id);
            setSelectedBodyData({
              id:   body.id,
              type: body.plugin?.customType || 'unknown',
              mass: body.mass,
              vx:   body.velocity.x.toFixed(2),
              vy:   body.velocity.y.toFixed(2),
              ke:   (0.5 * body.mass * (body.velocity.x ** 2 + body.velocity.y ** 2)).toFixed(1),
            });

            if (activeToolRef.current === 'pointer' && data.role === 'guest') {
              guestDraggingIdRef.current = body.id;
              dragOffsetRef.current = { x: body.position.x - mousePos.x, y: body.position.y - mousePos.y };
              socket.emit('guest-grab', { id: body.id });
            } else if (activeToolRef.current === 'joint' || activeToolRef.current === 'spring') {
              if (!selectedBodyForConstraintRef.current) {
                selectedBodyForConstraintRef.current = body.id;
              } else if (selectedBodyForConstraintRef.current !== body.id) {
                const bodyA = Matter.Composite.allBodies(engineRef.current.world)
                  .find(b => b.id === selectedBodyForConstraintRef.current);
                socket.emit('spawn-constraint', {
                  id: Math.floor(Math.random() * 10000000),
                  type: activeToolRef.current,
                  bodyAId: bodyA.id,
                  bodyBId: body.id,
                  length: activeToolRef.current === 'spring'
                    ? 0
                    : Math.hypot(bodyA.position.x - body.position.x, bodyA.position.y - body.position.y),
                });
                selectedBodyForConstraintRef.current = null;
              }
            }
          } else {
            selectedBodyForConstraintRef.current = null;
            setSelectedBodyId(null);
            setSelectedBodyData(null);
          }
        };

        handleGuestMouseMove = (e) => {
          if (activeToolRef.current !== 'pointer' || !guestDraggingIdRef.current) return;
          const mousePos = getLogicalMouse(e);
          const draggingBody = Matter.Composite.allBodies(engineRef.current.world)
            .find(b => b.id === guestDraggingIdRef.current);
          if (draggingBody) {
            const tX = Math.max(40, Math.min(1160, mousePos.x + dragOffsetRef.current.x));
            const tY = Math.max(40, Math.min(720, mousePos.y + dragOffsetRef.current.y));
            Matter.Body.setPosition(draggingBody, { x: tX, y: tY });
            Matter.Body.setVelocity(draggingBody, { x: 0, y: 0 });
            socket.emit('guest-drag', { id: draggingBody.id, x: tX, y: tY });
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
        if (bodyData.type === 'box')      newBody = Matter.Bodies.rectangle(bodyData.x, bodyData.y, 60, 60, { restitution: 0.6, render: { fillStyle: '#1b4f9e' } });
        else if (bodyData.type === 'circle')   newBody = Matter.Bodies.circle(bodyData.x, bodyData.y, 30, { restitution: 0.9, render: { fillStyle: '#0c6e49' } });
        else if (bodyData.type === 'heavyBox') newBody = Matter.Bodies.rectangle(bodyData.x, bodyData.y, 80, 80, { density: 0.1, restitution: 0.1, render: { fillStyle: '#0d1e34' } });
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
          const options = { bodyA, bodyB, length: cData.length, id: cData.id, plugin: { customType: cData.type } };
          if (cData.type === 'spring') { options.stiffness = 0.02; options.render = { type: 'line', strokeStyle: '#FF2D55', lineWidth: 4 }; }
          else { options.stiffness = 1; options.render = { type: 'line', strokeStyle: '#5856D6', lineWidth: 6 }; }
          Matter.World.add(engineRef.current.world, Matter.Constraint.create(options));
        }
      });
      if (hudBodiesRef.current)      hudBodiesRef.current.innerText = data.bodies.length;
      if (hudConstraintsRef.current) hudConstraintsRef.current.innerText = data.constraints.length;
      setBodyCount(data.bodies.length);
      setJointCount(data.constraints.length);
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
      if (shapeData.type === 'box')      newBody = Matter.Bodies.rectangle(shapeData.startX, shapeData.startY, 60, 60, { restitution: 0.6, render: { fillStyle: '#1b4f9e' } });
      else if (shapeData.type === 'circle')   newBody = Matter.Bodies.circle(shapeData.startX, shapeData.startY, 30, { restitution: 0.9, render: { fillStyle: '#0c6e49' } });
      else if (shapeData.type === 'heavyBox') newBody = Matter.Bodies.rectangle(shapeData.startX, shapeData.startY, 80, 80, { density: 0.1, restitution: 0.1, render: { fillStyle: '#0d1e34' } });
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
        const options = { bodyA, bodyB, length: data.length, id: data.id, plugin: { customType: data.type } };
        if (data.type === 'spring') { options.stiffness = 0.02; options.render = { type: 'line', strokeStyle: '#FF2D55', lineWidth: 4 }; }
        else { options.stiffness = 1; options.render = { type: 'line', strokeStyle: '#5856D6', lineWidth: 6 }; }
        Matter.World.add(engineRef.current.world, Matter.Constraint.create(options));
      }
    });

    socket.on('canvas-cleared', () => {
      if (!engineRef.current) return;
      Matter.World.remove(engineRef.current.world,
        Matter.Composite.allBodies(engineRef.current.world).filter(b => !b.isStatic));
      Matter.World.remove(engineRef.current.world,
        Matter.Composite.allConstraints(engineRef.current.world)
          .filter(c => !(mouseConstraintRef.current && c === mouseConstraintRef.current.constraint)));
      guestDraggingIdRef.current = null;
      selectedBodyForConstraintRef.current = null;
      setChartData([]);
      setBodyCount(0);
      setJointCount(0);
      setSelectedBodyId(null);
      setSelectedBodyData(null);
    });

    socket.on('environment-updated', (envData) => {
      if (!engineRef.current) return;
      setIsZeroG(envData.isZeroG);
      engineRef.current.world.gravity.y = envData.isZeroG ? 0 : 1;
    });

    socket.on('experiments-list', (list) => setSavedExperiments(list));

    return () => {
      cleanup();
      if (engineRef.current) Matter.Events.off(engineRef.current, 'afterUpdate');
      if (handleCanvasMouseDown && canvas) canvas.removeEventListener('mousedown', handleCanvasMouseDown);
      if (handleGuestMouseMove) window.removeEventListener('mousemove', handleGuestMouseMove);
      if (handleGuestMouseUp)   window.removeEventListener('mouseup',   handleGuestMouseUp);
      socket.disconnect();
      socket.off();
    };
  }, []);

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  const handleJoinRoom = (id) => {
    if (!id?.trim()) return;
    setRoomId(id.trim());
    socket.emit('join-room', id.trim());
    setHasJoined(true);
  };

  const handleAddShape = (type) => {
    if (!sceneRef.current) return;
    socket.emit('spawn-shape', {
      type,
      startX: 1200 / 2 + (Math.random() * 40 - 20),
      startY: 100,
      id: Math.floor(Math.random() * 10000000),
    });
  };

  const handleClearCanvas = () => { if (role === 'host') socket.emit('clear-canvas'); };

  const handleToggleGravity = () => {
    if (role !== 'host') return;
    const newZeroGState = !isZeroG;
    setIsZeroG(newZeroGState);
    engineRef.current.world.gravity.y = newZeroGState ? 0 : 1;
    socket.emit('update-environment', { isZeroG: newZeroGState });
  };

  const openLibrary = () => {
    socket.emit('request-experiments');
    setIsLibraryOpen(true);
  };

  const handleSaveExperiment = (e) => {
    e.preventDefault();
    if (!newExpName.trim() || !engineRef.current) return;
    const snapshotBodies = Matter.Composite.allBodies(engineRef.current.world)
      .filter(b => !b.isStatic && b.plugin && b.plugin.customType)
      .map(b => ({ id: b.id, type: b.plugin.customType, x: b.position.x, y: b.position.y, angle: b.angle, velocity: b.velocity }));
    const snapshotConstraints = Matter.Composite.allConstraints(engineRef.current.world)
      .filter(c => !(mouseConstraintRef.current && c === mouseConstraintRef.current.constraint))
      .map(c => ({ id: c.id, type: c.plugin?.customType || 'joint', bodyAId: c.bodyA.id, bodyBId: c.bodyB.id, length: c.length }));
    socket.emit('save-experiment', { name: newExpName, bodies: snapshotBodies, constraints: snapshotConstraints });
    setNewExpName('');
  };

  const handleLoadExperiment = (exp) => {
    socket.emit('trigger-load-experiment', exp);
    setIsLibraryOpen(false);
  };

  const handleDeleteExperiment = (id) => {
    if (window.confirm('Delete this template?')) socket.emit('delete-experiment', id);
  };

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* JOIN SCREEN OVERLAY */}
      {!hasJoined && <JoinScreen onJoin={handleJoinRoom} />}

      {/* TOP BAR */}
      {hasJoined && (
        <TopBar roomId={roomId} role={role} onOpenTweaks={() => setShowTweaks(true)} />
      )}

      {/* MAIN AREA */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* CANVAS AREA */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          {/* Floating toolbar */}
          {hasJoined && (
            <Toolbar
              activeTool={activeTool}
              onSetTool={setActiveTool}
              onAddShape={handleAddShape}
              onClear={handleClearCanvas}
              onToggleGravity={handleToggleGravity}
              onOpenLibrary={openLibrary}
              isZeroG={isZeroG}
              isHost={role === 'host'}
            />
          )}

          {/* Physics canvas — centered to preserve 3:2 aspect ratio */}
          <div ref={sceneRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />

          {/* HUD */}
          {hasJoined && (
            <HUD bodiesRef={hudBodiesRef} constraintsRef={hudConstraintsRef} isZeroG={isZeroG} />
          )}

          {/* Body inspector */}
          {hasJoined && selectedBodyData && (
            <BodyInspector
              body={selectedBodyData}
              onClose={() => { setSelectedBodyId(null); setSelectedBodyData(null); }}
            />
          )}

          {/* Hint bar */}
          {hasJoined && (
            <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(11,18,32,0.7)', border: '1px solid var(--b)',
              borderRadius: 6, padding: '4px 12px', pointerEvents: 'none', zIndex: 10 }}>
              <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                color: 'var(--td)', letterSpacing: '0.06em' }}>
                {HINTS[activeTool]}
              </span>
            </div>
          )}
        </div>

        {/* ANALYTICS SIDEBAR */}
        {hasJoined && t.showAnalytics && (
          <AnalyticsPanel chartData={chartData} bodyCount={bodyCount} jointCount={jointCount} />
        )}
      </div>

      {/* LIBRARY MODAL */}
      {isLibraryOpen && (
        <LibraryModal
          isHost={role === 'host'}
          experiments={savedExperiments}
          newExpName={newExpName}
          setNewExpName={setNewExpName}
          onSave={handleSaveExperiment}
          onLoad={handleLoadExperiment}
          onDelete={handleDeleteExperiment}
          onClose={() => setIsLibraryOpen(false)}
        />
      )}

      {/* TWEAKS PANEL */}
      <TweaksPanel title="Tweaks" open={showTweaks} onClose={() => setShowTweaks(false)}>
        <TweakSection label="Display" />
        <TweakToggle label="Analytics Panel" value={t.showAnalytics}
          onChange={v => setTweak('showAnalytics', v)} />
        <TweakSection label="Color Scheme" />
        <TweakRadio label="Scheme" value={t.scheme}
          options={[
            { label: 'Sci-Dark', value: 'sci-dark' },
            { label: 'Terminal', value: 'terminal' },
            { label: 'Midnight', value: 'midnight' },
            { label: 'Light',    value: 'light'    },
          ]}
          onChange={v => setTweak('scheme', v)} />
      </TweaksPanel>
    </div>
  );
};

export default PhysicsCanvas;
