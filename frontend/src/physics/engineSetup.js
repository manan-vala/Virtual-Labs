import Matter from 'matter-js';

const SCHEME_BG = {
  'sci-dark': '#07090e',
  'terminal': '#030d05',
  'midnight': '#08050f',
  'light':    '#f0f4fa',
};

export const initPhysics = (containerRef) => {
  if (containerRef.current) containerRef.current.innerHTML = '';

  const { Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint } = Matter;
  const engine = Engine.create();
  const world = engine.world;

  const render = Render.create({
    element: containerRef.current,
    engine: engine,
    options: {
      width: 1200,
      height: 800,
      wireframes: false,
      background: '#07090e',
      pixelRatio: 1
    }
  });

  // Size canvas to fit the container while preserving 3:2 aspect ratio.
  // Explicit pixel dimensions are reliable across browsers and flex layouts.
  render.canvas.style.display = 'block';
  const fitCanvas = () => {
    const c = containerRef.current;
    if (!c) return;
    const cw = c.clientWidth, ch = c.clientHeight;
    if (cw <= 0 || ch <= 0) return;
    const aspect = 1200 / 800;
    let w, h;
    if (cw / ch > aspect) { h = ch; w = h * aspect; }
    else                  { w = cw; h = w / aspect; }
    render.canvas.style.width  = w + 'px';
    render.canvas.style.height = h + 'px';
  };
  fitCanvas();
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fitCanvas) : null;
  if (ro) ro.observe(containerRef.current);
  window.addEventListener('resize', fitCanvas);

  const width = 1200;
  const height = 800;
  const thickness = 1000;

  const mkWall = () => ({ isStatic: true, render: { fillStyle: '#07090e' } });

  const visibleFloorHeight = 40;
  const ground    = Bodies.rectangle(width/2, height + thickness/2 - visibleFloorHeight, width*3, thickness, mkWall());
  const ceiling   = Bodies.rectangle(width/2, -thickness/2, width*3, thickness, mkWall());
  const leftWall  = Bodies.rectangle(-thickness/2, height/2, thickness, height*3, mkWall());
  const rightWall = Bodies.rectangle(width + thickness/2, height/2, thickness, height*3, mkWall());

  World.add(world, [ground, ceiling, leftWall, rightWall]);

  const mouse = Mouse.create(render.canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.2, render: { visible: false } }
  });
  World.add(world, mouseConstraint);
  render.mouse = mouse;

  // ── 3D lighting overlay ────────────────────────────────────────────────────
  Matter.Events.on(render, 'afterRender', () => {
    const ctx = render.context;
    Matter.Composite.allBodies(engine.world).forEach(body => {
      if (body.isStatic) return;
      const { x, y } = body.position;
      const type = body.plugin?.customType;

      ctx.save();

      if (type === 'circle') {
        const r = body.circleRadius || 30;
        // Ambient shading: top-left bright → bottom-right dark
        const ambient = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.05, x, y, r);
        ambient.addColorStop(0,    'rgba(255,255,255,0.26)');
        ambient.addColorStop(0.45, 'rgba(255,255,255,0.03)');
        ambient.addColorStop(1,    'rgba(0,0,0,0.28)');
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = ambient;
        ctx.fill();
        // Specular highlight
        const spec = ctx.createRadialGradient(x - r * 0.28, y - r * 0.32, 0, x - r * 0.28, y - r * 0.32, r * 0.28);
        spec.addColorStop(0, 'rgba(255,255,255,0.52)');
        spec.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = spec;
        ctx.fill();
      } else {
        // Box / HeavyBox: clip to actual (rotated) shape, then apply gradients
        const verts = body.vertices;
        ctx.beginPath();
        ctx.moveTo(verts[0].x, verts[0].y);
        for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i].x, verts[i].y);
        ctx.closePath();
        ctx.clip();

        const b = body.bounds;
        const bw = b.max.x - b.min.x;
        const bh = b.max.y - b.min.y;

        // Top-to-bottom shading
        const grad = ctx.createLinearGradient(x, b.min.y, x, b.max.y);
        grad.addColorStop(0,    'rgba(255,255,255,0.22)');
        grad.addColorStop(0.38, 'rgba(255,255,255,0.04)');
        grad.addColorStop(1,    'rgba(0,0,0,0.26)');
        ctx.fillStyle = grad;
        ctx.fillRect(b.min.x - 1, b.min.y - 1, bw + 2, bh + 2);

        // Left-edge highlight
        const edge = ctx.createLinearGradient(b.min.x, y, b.min.x + bw * 0.35, y);
        edge.addColorStop(0, 'rgba(255,255,255,0.10)');
        edge.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = edge;
        ctx.fillRect(b.min.x - 1, b.min.y - 1, bw + 2, bh + 2);
      }

      ctx.restore();
    });
  });

  Matter.Render.run(render);
  const runner = Matter.Runner.create();
  const walls = [ground, ceiling, leftWall, rightWall];

  return {
    engine,
    world,
    runner,
    render,
    mouseConstraint,
    setScheme: (scheme) => {
      const bg = SCHEME_BG[scheme] || '#07090e';
      render.options.background = bg;
      walls.forEach(w => { w.render.fillStyle = bg; });
    },
    cleanup: () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', fitCanvas);
      Matter.Events.off(render, 'afterRender');
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      if (render.canvas) {
        render.canvas.remove();
        render.canvas = null;
      }
    }
  };
};
