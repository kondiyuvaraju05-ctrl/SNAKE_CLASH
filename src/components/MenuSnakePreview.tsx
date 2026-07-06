import React, { useEffect, useRef } from 'react';

export default function MenuSnakePreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Grid size parameters
    const GRID_SIZE = 10;
    const CELL_SIZE = 26; // nice and crisp size for 260x260 preview
    const WIDTH = GRID_SIZE * CELL_SIZE;
    const HEIGHT = GRID_SIZE * CELL_SIZE;

    // Set high-DPI canvas resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.scale(dpr, dpr);

    // Initial state
    let snake = [
      { x: 3, y: 5 },
      { x: 2, y: 5 },
      { x: 1, y: 5 },
      { x: 0, y: 5 },
    ];
    let direction = 'RIGHT';
    let food = { x: 7, y: 3 };
    let bomb = { x: 3, y: 8 };
    let frameCount = 0;

    const getRandomPos = () => {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      return { x, y };
    };

    // Keep simulation fluid
    let animId: number;

    const updateSimulation = () => {
      const head = { ...snake[0] };

      // Self-contained simple AI: steer towards food
      const target = food;
      const diffX = target.x - head.x;
      const diffY = target.y - head.y;

      let nextDir = direction;

      if (diffX !== 0) {
        const desiredDir = diffX > 0 ? 'RIGHT' : 'LEFT';
        // Prevent moving backwards
        if (
          !(desiredDir === 'LEFT' && direction === 'RIGHT') &&
          !(desiredDir === 'RIGHT' && direction === 'LEFT')
        ) {
          nextDir = desiredDir;
        } else {
          nextDir = diffY > 0 ? 'DOWN' : 'UP';
        }
      } else if (diffY !== 0) {
        const desiredDir = diffY > 0 ? 'DOWN' : 'UP';
        if (
          !(desiredDir === 'UP' && direction === 'DOWN') &&
          !(desiredDir === 'DOWN' && direction === 'UP')
        ) {
          nextDir = desiredDir;
        } else {
          nextDir = diffX > 0 ? 'RIGHT' : 'LEFT';
        }
      }

      direction = nextDir;

      // Update movement
      if (direction === 'RIGHT') head.x += 1;
      else if (direction === 'LEFT') head.x -= 1;
      else if (direction === 'UP') head.y -= 1;
      else if (direction === 'DOWN') head.y += 1;

      // Teleport borders to mimic wrap safely
      head.x = (head.x + GRID_SIZE) % GRID_SIZE;
      head.y = (head.y + GRID_SIZE) % GRID_SIZE;

      // Eat food checks
      if (head.x === food.x && head.y === food.y) {
        snake.unshift(head);
        food = getRandomPos();
        // Move bomb safely away from food and head
        do {
          bomb = getRandomPos();
        } while (
          (bomb.x === food.x && bomb.y === food.y) ||
          (bomb.x === head.x && bomb.y === head.y)
        );
      } else {
        snake.unshift(head);
        snake.pop();
      }

      // If snake segment collides, trim back to avoid stuckness after a while
      if (snake.length > 7) {
        snake = snake.slice(0, 4);
      }
    };

    const drawGrid = () => {
      ctx.fillStyle = '#100f13';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Draw subtle retro grid mesh
      ctx.strokeStyle = '#1e1c24';
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID_SIZE; i++) {
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(WIDTH, i * CELL_SIZE);
        ctx.stroke();

        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, HEIGHT);
        ctx.stroke();
      }
    };

    const drawState = () => {
      // 1. Draw Cyan Food Item
      const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
      const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
      ctx.shadowColor = '#67e8f9';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.arc(foodX, foodY, CELL_SIZE / 3, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw Red Bomb
      const bombX = bomb.x * CELL_SIZE + CELL_SIZE / 2;
      const bombY = bomb.y * CELL_SIZE + CELL_SIZE / 2;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(bombX, bombY, CELL_SIZE / 3, 0, Math.PI * 2);
      ctx.fill();

      // Clear shadows for snake body segments
      ctx.shadowBlur = 0;

      // 3. Draw Snake Tail and Body (glowing pink)
      snake.forEach((segment, idx) => {
        const isHead = idx === 0;
        const sX = segment.x * CELL_SIZE + 2;
        const sY = segment.y * CELL_SIZE + 2;
        const size = CELL_SIZE - 4;

        if (isHead) {
          // Glowy bright white head
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 14;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(sX, sY, size, size, 6);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Radiant customized pink neon scales matching screenshot perfectly
          ctx.fillStyle = '#ff007f';
          ctx.beginPath();
          ctx.roundRect(sX, sY, size, size, 4);
          ctx.fill();
        }
      });
    };

    const loop = () => {
      frameCount++;
      // Speed update: run simulation every 12 frames (~200ms)
      if (frameCount % 12 === 0) {
        updateSimulation();
      }

      drawGrid();
      drawState();

      animId = requestAnimationFrame(loop);
    };

    // Begin looping
    loop();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="relative p-1 bg-[#100f13] border-4 border-[#1f1a26] rounded-3xl shadow-[0_0_40px_rgba(31,26,38,0.8),inset_0_2px_4px_rgba(255,255,255,0.06)] scale-[0.98] sm:scale-100 transition-transform duration-300">
      
      {/* Corner design fasteners */}
      <div className="absolute top-2.5 left-2.5 w-1.5 h-1.5 bg-slate-700/40 rounded-full" />
      <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-slate-700/40 rounded-full" />
      <div className="absolute bottom-2.5 left-2.5 w-1.5 h-1.5 bg-slate-700/40 rounded-full" />
      <div className="absolute bottom-2.5 right-2.5 w-1.5 h-1.5 bg-slate-700/40 rounded-full" />

      {/* Screen Gloss highlight */}
      <div className="absolute inset-x-4 top-2 h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none rounded-t-2xl z-20" />

      {/* Canvas wrapper */}
      <div className="overflow-hidden rounded-2xl">
        <canvas
          ref={canvasRef}
          className="block bg-[#100f13] cursor-default"
        />
      </div>

    </div>
  );
}
