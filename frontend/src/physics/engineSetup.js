import Matter from 'matter-js';

export const initPhysics = (containerRef) => {
  const { Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint } = Matter;

  // 1. Create the engine and world
  const engine = Engine.create();
  const world = engine.world;

  // 2. Create the renderer
  const render = Render.create({
    element: containerRef.current,
    engine: engine,
    options: {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      wireframes: false,
      background: '#f8fafc',
    }
  });

  // 3. Add massive, interlocking boundaries to prevent objects escaping
  const width = render.options.width;
  const height = render.options.height;
  const thickness = 1000; 
  
  const wallConfig = { 
    isStatic: true, 
    render: { fillStyle: '#475569' } 
  };

  const ground = Bodies.rectangle(width / 2, height + (thickness / 2), width * 3, thickness, wallConfig);
  const ceiling = Bodies.rectangle(width / 2, -(thickness / 2), width * 3, thickness, wallConfig);
  const leftWall = Bodies.rectangle(-(thickness / 2), height / 2, thickness, height * 3, wallConfig);
  const rightWall = Bodies.rectangle(width + (thickness / 2), height / 2, thickness, height * 3, wallConfig);

  // 4. Add a test box
  const testBox = Bodies.rectangle(width / 2, 100, 80, 80, { 
    restitution: 0.7, 
    render: { fillStyle: '#3b82f6' } 
  });

  World.add(world, [ground, leftWall, rightWall, ceiling, testBox]);

  // 5. Add Mouse Interaction
  const mouse = Mouse.create(render.canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: { visible: false }
    }
  });
  World.add(world, mouseConstraint);
  render.mouse = mouse;

  // 6. Run the engine and renderer
  Render.run(render);
  const runner = Runner.create();
  Runner.run(runner, engine);

  return {
    engine,
    world,
    cleanup: () => {
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      render.canvas.remove();
      render.canvas = null;
      render.context = null;
      render.textures = {};
    }
  };
};