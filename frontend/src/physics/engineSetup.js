import Matter from 'matter-js';

export const initPhysics = (containerRef) => {
  // Nuke phantom canvases from React Strict Mode
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
      background: '#f8fafc',
      pixelRatio: 1 // FIX: Forces 1:1 mouse tracking mapping
    }
  });

  render.canvas.style.width = '100%';
  render.canvas.style.height = '100%';

  const width = 1200;
  const height = 800;
  const thickness = 1000; 
  
  const wallConfig = { isStatic: true, render: { fillStyle: '#475569' } };
  
  const visibleFloorHeight = 40;
  const ground = Bodies.rectangle(width / 2, height + (thickness / 2) - visibleFloorHeight, width * 3, thickness, wallConfig); 
  const ceiling = Bodies.rectangle(width / 2, -(thickness / 2), width * 3, thickness, wallConfig);
  const leftWall = Bodies.rectangle(-(thickness / 2), height / 2, thickness, height * 3, wallConfig);
  const rightWall = Bodies.rectangle(width + (thickness / 2), height / 2, thickness, height * 3, wallConfig);

  World.add(world, [ground, leftWall, rightWall, ceiling]);

  // FIX: Rely on native Matter.js mouse logic
  const mouse = Mouse.create(render.canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: { stiffness: 0.2, render: { visible: false } }
  });
  World.add(world, mouseConstraint);
  render.mouse = mouse;

  Matter.Render.run(render);
  const runner = Matter.Runner.create();

  return {
    engine,
    world,
    runner,
    mouseConstraint,
    cleanup: () => {
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