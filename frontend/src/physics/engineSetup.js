import Matter from 'matter-js';

export const initPhysics = (containerRef) => {
  const { Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint } = Matter;

  // 1. Create the engine and world
  const engine = Engine.create();
  const world = engine.world;

  // 2. Create the renderer (injects canvas into the React ref)
  const render = Render.create({
    element: containerRef.current,
    engine: engine,
    options: {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      wireframes: false, // Set to false to render solid colors
      background: '#f8fafc', // Matches Tailwind slate-50
    }
  });

  // 3. Add boundaries (ground and walls) so objects don't fall into the void
  // 3. Add boundaries (Massive, interlocking bumpers)
  const width = render.options.width;
  const height = render.options.height;
  const thickness = 1000; // 1000px thick walls!
  
  const wallConfig = { 
    isStatic: true, 
    render: { fillStyle: '#475569' } 
  };

  // Center the walls on the edges, but make them extend infinitely outward and overlap each other
  const ground = Bodies.rectangle(width / 2, height + (thickness / 2), width * 3, thickness, wallConfig);
  const ceiling = Bodies.rectangle(width / 2, -(thickness / 2), width * 3, thickness, wallConfig);
  const leftWall = Bodies.rectangle(-(thickness / 2), height / 2, thickness, height * 3, wallConfig);
  const rightWall = Bodies.rectangle(width + (thickness / 2), height / 2, thickness, height * 3, wallConfig);

  // 4. Add a test box with some bounciness (restitution)
  const testBox = Bodies.rectangle(width / 2, 100, 80, 80, { 
    restitution: 0.7, // Adds a nice bounce so it doesn't just stick to the walls
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

  // Keep the mouse in sync with the rendering scale
  render.mouse = mouse;

  // 6. Run the engine and renderer
  Render.run(render);
  const runner = Runner.create();
  Runner.run(runner, engine);

  // Return a cleanup function for React's useEffect
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