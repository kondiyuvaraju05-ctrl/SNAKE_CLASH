import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Volume2, VolumeX, RotateCcw, Skull, ArrowLeft, Gamepad2, Compass, Shield, Eye } from 'lucide-react';
import { Position, Difficulty, GameMode } from '../types';
import { 
  playEatSound, playSpecialEatSound, playGameOverSound, 
  playMoveSound, isSoundEnabled, setSoundEnabled, playStartSound
} from '../utils/audio';

interface GameBoardProps {
  difficulty: Difficulty;
  gameMode: GameMode;
  onBackToMenu: () => void;
  highScore: number;
  onUpdateHighScore: (score: number) => void;
  soundOn: boolean;
  onToggleSound: () => void;
}

const GRID_SIZE = 20; // 20x20 coordinates system

export default function GameBoard({ 
  difficulty, 
  gameMode,
  onBackToMenu, 
  highScore, 
  onUpdateHighScore,
  soundOn,
  onToggleSound
}: GameBoardProps) {
  // Game state
  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('UP');
  const [nextDirection, setNextDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('UP');
  
  // Custom eggs
  const [smallEgg, setSmallEgg] = useState<Position>({ x: 5, y: 5 });
  const [bigEgg, setBigEgg] = useState<Position | null>(null);
  
  const [score, setScore] = useState<number>(0);
  const [eggsEaten, setEggsEaten] = useState<number>(0);
  const [smallEggsEatenInCycle, setSmallEggsEatenInCycle] = useState<number>(0);
  
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Mode-specific parameters
  const [tickCount, setTickCount] = useState<number>(0);
  const [shrinkLevel, setShrinkLevel] = useState<number>(0);
  const [lasers, setLasers] = useState<{ coordinate: number; type: 'ROW' | 'COL'; status: 'WARNING' | 'ACTIVE' }[]>([]);
  const [rushObstacles, setRushObstacles] = useState<Position[]>([]);
  const [exitPortal, setExitPortal] = useState<Position | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canvasDim, setCanvasDim] = useState<number>(380);

  // Keep references of up-to-date states so we can safely read them inside the tick setInterval
  // without triggering cross-component render updates or resetting the timer on every change.
  const stateRef = useRef({
    snake,
    direction,
    nextDirection,
    smallEgg,
    bigEgg,
    score,
    eggsEaten,
    smallEggsEatenInCycle,
    tickCount,
    shrinkLevel,
    lasers,
    rushObstacles,
    exitPortal,
  });

  useEffect(() => {
    stateRef.current = {
      snake,
      direction,
      nextDirection,
      smallEgg,
      bigEgg,
      score,
      eggsEaten,
      smallEggsEatenInCycle,
      tickCount,
      shrinkLevel,
      lasers,
      rushObstacles,
      exitPortal,
    };
  }, [
    snake, direction, nextDirection, smallEgg, bigEgg, score, eggsEaten, smallEggsEatenInCycle,
    tickCount, shrinkLevel, lasers, rushObstacles, exitPortal
  ]);

  // sound helper
  const toggleMute = () => {
    onToggleSound();
  };

  // Level progression formula (Level 1 to 10)
  // Determined by total eggs eaten: progresses every 5 eggs
  const currentLevel = Math.min(10, Math.floor(eggsEaten / 5) + 1);

  // Speed tick rate interval (ms). Slow start, increases as level increases
  const getSpeedInterval = (): number => {
    // Speed values are lower (faster) as currentLevel goes from 1 to 10
    const levelIndex = currentLevel - 1; // 0 to 9
    if (difficulty === 'EASY') {
      return Math.max(80, 220 - levelIndex * 14);
    } else if (difficulty === 'MEDIUM') {
      return Math.max(50, 160 - levelIndex * 12);
    } else {
      // HARD
      return Math.max(30, 100 - levelIndex * 7);
    }
  };

  const speedMs = getSpeedInterval();

  // Symmetrical maze layout design for Maze Escape
  const generateMazeWalls = useCallback((): Position[] => {
    const walls: Position[] = [];
    // symmetric internal block bricks that leave ample slither paths:
    // Left column corridor blocks
    for (let i = 4; i <= 15; i++) {
      if (i !== 9 && i !== 10) {
        walls.push({ x: 4, y: i });
        walls.push({ x: 15, y: i });
      }
    }
    // Middle shelf columns inside
    for (let j = 7; j <= 12; j++) {
      if (j === 8 || j === 11) {
        walls.push({ x: j, y: 5 });
        walls.push({ x: j, y: 14 });
      }
    }
    return walls;
  }, []);

  // Safe coordinate generator
  const generateNewFoodPosition = useCallback((currentSnake: Position[]): Position => {
    let position: Position = { x: 0, y: 0 };
    let isValid = false;
    let attempts = 0;

    // Use current states from stateRef to prevent stale closures
    const currentObstacles = stateRef?.current?.rushObstacles || [];
    const currentShrink = stateRef?.current?.shrinkLevel || 0;

    while (!isValid && attempts < 400) {
      const rx = Math.floor(Math.random() * GRID_SIZE);
      const ry = Math.floor(Math.random() * GRID_SIZE);
      
      const hitsSnake = currentSnake.some(seg => seg.x === rx && seg.y === ry);
      
      let hitsObstacle = false;
      if (gameMode === 'MAZE_ESCAPE') {
        hitsObstacle = generateMazeWalls().some(w => w.x === rx && w.y === ry);
      } else if (gameMode === 'SHRINKING_ARENA') {
        hitsObstacle = (rx < currentShrink || rx >= GRID_SIZE - currentShrink || ry < currentShrink || ry >= GRID_SIZE - currentShrink);
      } else if (gameMode === 'OBSTACLE_RUSH') {
        hitsObstacle = currentObstacles.some(w => w.x === rx && w.y === ry);
      }

      if (!hitsSnake && !hitsObstacle) {
        position = { x: rx, y: ry };
        isValid = true;
      }
      attempts++;
    }
    return position;
  }, [gameMode, generateMazeWalls]);

  // Set initial food position on mounting
  useEffect(() => {
    const freshFood = generateNewFoodPosition(stateRef.current.snake);
    setSmallEgg(freshFood);

    if (gameMode === 'MAZE_ESCAPE') {
      const walls = generateMazeWalls();
      let targetExitPortal: Position | null = null;
      let exitFound = false;
      let limit = 0;
      while (!exitFound && limit < 100) {
        const rx = Math.floor(Math.random() * GRID_SIZE);
        const ry = Math.floor(Math.random() * GRID_SIZE);
        const hitsSnake = stateRef.current.snake.some(s => s.x === rx && s.y === ry);
        const hitsWall = walls.some(w => w.x === rx && w.y === ry);
        const hitsFood = freshFood.x === rx && freshFood.y === ry;
        if (!hitsSnake && !hitsWall && !hitsFood) {
          targetExitPortal = { x: rx, y: ry };
          exitFound = true;
        }
        limit++;
      }
      setExitPortal(targetExitPortal || { x: 18, y: 18 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode]);

  // Update canvas sizing responsively
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        // make it as large as possible but keeping square ratio
        const size = Math.min(width, 420);
        setCanvasDim(size);
      }
    });
    observer.observe(containerRef.current);
    
    const bounds = containerRef.current.getBoundingClientRect();
    setCanvasDim(Math.min(bounds.width, 420));
    return () => observer.disconnect();
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'Escape'].includes(e.code)) {
        e.preventDefault();
        if (hasStarted && !isGameOver) {
          setIsPaused(prev => !prev);
        }
        return;
      }

      if (isPaused) return;

      if (['ArrowUp', 'KeyW'].includes(e.code) && direction !== 'DOWN') {
        e.preventDefault();
        setNextDirection('UP');
        playMoveSound();
      } else if (['ArrowDown', 'KeyS'].includes(e.code) && direction !== 'UP') {
        e.preventDefault();
        setNextDirection('DOWN');
        playMoveSound();
      } else if (['ArrowLeft', 'KeyA'].includes(e.code) && direction !== 'RIGHT') {
        e.preventDefault();
        setNextDirection('LEFT');
        playMoveSound();
      } else if (['ArrowRight', 'KeyD'].includes(e.code) && direction !== 'LEFT') {
        e.preventDefault();
        setNextDirection('RIGHT');
        playMoveSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isPaused, hasStarted, isGameOver]);

  // Core game mechanics tick loop
  useEffect(() => {
    if (!hasStarted || isGameOver || isPaused) return;

    const intervalId = setInterval(() => {
      const current = stateRef.current;
      const head = current.snake[0];
      let dx = 0;
      let dy = 0;

      // Update direction to match nextDirection
      setDirection(current.nextDirection);

      switch (current.nextDirection) {
        case 'UP': dy = -1; break;
        case 'DOWN': dy = 1; break;
        case 'LEFT': dx = -1; break;
        case 'RIGHT': dx = 1; break;
      }

      const nextX = head.x + dx;
      const nextY = head.y + dy;

      // 1. IN SNAKE SURVIVAL mode: touching borders is instant death
      if (gameMode === 'SNAKE_SURVIVAL') {
        if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
          setIsGameOver(true);
          playGameOverSound();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 50, 150]);
          }
          return;
        }
      }

      // Border wrapping for regular modes:
      const didWrap = nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE;
      if (didWrap && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }

      const newHead: Position = {
        x: (nextX + GRID_SIZE) % GRID_SIZE,
        y: (nextY + GRID_SIZE) % GRID_SIZE
      };

      // 2. CHECK DEADLY COLLISIONS depending on GameMode:
      
      // Hit maze wall in MAZE_ESCAPE?
      const hitMazeWall = gameMode === 'MAZE_ESCAPE' && generateMazeWalls().some(w => w.x === newHead.x && w.y === newHead.y);
      
      // Hit shrinking outer wall in SHRINKING_ARENA?
      const hitShrinkWall = gameMode === 'SHRINKING_ARENA' && (
        newHead.x < current.shrinkLevel || newHead.x >= GRID_SIZE - current.shrinkLevel ||
        newHead.y < current.shrinkLevel || newHead.y >= GRID_SIZE - current.shrinkLevel
      );

      // Hit continuous barrier in OBSTACLE_RUSH?
      const hitRushObstacle = gameMode === 'OBSTACLE_RUSH' && current.rushObstacles.some(w => w.x === newHead.x && w.y === newHead.y);

      // Crossed laser beams in LASER_WALLS?
      const hitLaserBeam = gameMode === 'LASER_WALLS' && current.lasers.some(l => 
        l.status === 'ACTIVE' && (
          (l.type === 'ROW' && newHead.y === l.coordinate) ||
          (l.type === 'COL' && newHead.x === l.coordinate)
        )
      );

      if (hitMazeWall || hitShrinkWall || hitRushObstacle || hitLaserBeam) {
        setIsGameOver(true);
        playGameOverSound();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 150]);
        }
        return;
      }

      // If the snake's head hits its own body tile -> GAME OVER
      const isBitingSelf = current.snake.slice(0, -1).some(seg => seg.x === newHead.x && seg.y === newHead.y);
      if (isBitingSelf) {
        setIsGameOver(true);
        playGameOverSound();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 150]);
        }
        return;
      }

      const newSnake = [newHead, ...current.snake];

      // 3. EXIT PORTAL (MAZE_ESCAPE Mode Winner Target)
      if (gameMode === 'MAZE_ESCAPE' && current.exitPortal && newHead.x === current.exitPortal.x && newHead.y === current.exitPortal.y) {
        playSpecialEatSound();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([40, 40, 40]);
        }

        const nextScore = current.score + 15; // 15 points for completing maze escape route!
        const nextEggs = current.eggsEaten + 1;

        setScore(nextScore);
        setEggsEaten(nextEggs);

        if (nextScore > highScore) {
          onUpdateHighScore(nextScore);
        }

        // Spawn a brand new exit destination safely out of walls
        const nextExit = generateNewFoodPosition(newSnake);
        setExitPortal(nextExit);
        setSnake(newSnake);
        return;
      }

      // Did we eat a small egg?
      if (newHead.x === current.smallEgg.x && newHead.y === current.smallEgg.y) {
        playEatSound();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(30);
        }
        
        const nextScore = current.score + 1;
        const nextEggs = current.eggsEaten + 1;
        const nextCycle = current.smallEggsEatenInCycle + 1;

        setScore(nextScore);
        setEggsEaten(nextEggs);
        
        if (nextScore > highScore) {
          onUpdateHighScore(nextScore);
        }

        // Handle custom Big Egg generation trigger:
        if (nextCycle >= 5) {
          const targetSp = generateNewFoodPosition(newSnake);
          setBigEgg(targetSp);
          setSmallEggsEatenInCycle(0);
        } else {
          setSmallEggsEatenInCycle(nextCycle);
        }

        setSmallEgg(generateNewFoodPosition(newSnake));
        setSnake(newSnake);
      }
      // Did we eat the big egg?
      else if (current.bigEgg && newHead.x === current.bigEgg.x && newHead.y === current.bigEgg.y) {
        playSpecialEatSound();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([40, 40, 40]);
        }
        
        const nextScore = current.score + 5; // Big egg gives 5 points
        const nextEggs = current.eggsEaten + 1;

        setScore(nextScore);
        setEggsEaten(nextEggs);
        setBigEgg(null); // Remove big egg from the board

        if (nextScore > highScore) {
          onUpdateHighScore(nextScore);
        }

        setSnake(newSnake);
      } 
      else {
        // Normal slither: discard tail segment
        newSnake.pop();
        setSnake(newSnake);
      }

      // Increment cycle steps to handle continuous obstacle spawns of special arenas
      setTickCount(prev => {
        const nextTick = prev + 1;

        // Shrinking Arena borders shrink every 12 snake steps
        if (gameMode === 'SHRINKING_ARENA' && nextTick > 0 && nextTick % 12 === 0) {
          setShrinkLevel(s => Math.min(4, s + 1));
        }

        // Obstacles Rush - Obstacles spawn continuously while you survive: new brick obstacle every 10 steps
        if (gameMode === 'OBSTACLE_RUSH' && nextTick > 0 && nextTick % 10 === 0) {
          setRushObstacles(prevObst => {
            const added = generateNewFoodPosition(newSnake);
            return [...prevObst, added];
          });
        }

        // Laser Walls - Lasers turn active/warnings in warning-cycle loop
        if (gameMode === 'LASER_WALLS') {
          const lCycle = nextTick % 16;
          if (lCycle === 8) {
            const rRow = Math.floor(Math.random() * GRID_SIZE);
            const rCol = Math.floor(Math.random() * GRID_SIZE);
            setLasers([
              { coordinate: rRow, type: 'ROW', status: 'WARNING' },
              { coordinate: rCol, type: 'COL', status: 'WARNING' }
            ]);
          } else if (lCycle === 11) {
            setLasers(curr => curr.map(laser => ({ ...laser, status: 'ACTIVE' })));
          } else if (lCycle === 15 || lCycle === 0) {
            setLasers([]);
          }
        }

        return nextTick;
      });

    }, speedMs);

    gameIntervalRef.current = intervalId;

    return () => {
      clearInterval(intervalId);
    };
  }, [hasStarted, isGameOver, isPaused, speedMs, highScore, onUpdateHighScore, generateNewFoodPosition, gameMode, generateMazeWalls]);

  // Redraw Canvas & Dynamic Realistic Animations with requestAnimationFrame
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvasDim * dpr;
      canvas.height = canvasDim * dpr;
      ctx.scale(dpr, dpr);

      const cellSize = canvasDim / GRID_SIZE;

      // Deep premium high contrast dark mesh background (styled differently once 2 or more resources are eaten)
      if (eggsEaten >= 2) {
        // Deep copper-sunset tech radial gradient when 2+ resources are taken
        const bgGrad = ctx.createRadialGradient(
          canvasDim / 2, canvasDim / 2, canvasDim * 0.1,
          canvasDim / 2, canvasDim / 2, canvasDim * 0.85
        );
        bgGrad.addColorStop(0, '#1c100a'); // deep warm copper core
        bgGrad.addColorStop(0.5, '#0b0705'); // rich roasted cocoa transition
        bgGrad.addColorStop(1, '#050302'); // obsidian frame base
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvasDim, canvasDim);

        // Subtle ambient glowing circuit star nodes as dynamic background indicators
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        for (let star = 0; star < 12; star++) {
          const starX = ((star * 4 + 2) % GRID_SIZE) * cellSize + cellSize / 2;
          const starY = ((star * 7 + 3) % GRID_SIZE) * cellSize + cellSize / 2;
          ctx.beginPath();
          ctx.arc(starX, starY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = '#0c0908'; 
        ctx.fillRect(0, 0, canvasDim, canvasDim);
      }

      // Subtle, high contrast grid matrix guides (adaptive when taking 2 or more resources)
      ctx.strokeStyle = eggsEaten >= 2 ? 'rgba(245, 158, 11, 0.08)' : '#18120e'; 
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvasDim);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvasDim, i * cellSize);
        ctx.stroke();
      }

      // Border glowing neon frame outline (pulsating hot orange for 2 or more resources, deep warm amber initially)
      ctx.strokeStyle = eggsEaten >= 2 ? '#ea580c' : '#7c2d12'; 
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, canvasDim, canvasDim);

      // --- GAME MODE SPECIFIC RENDER LAYERS ---
      
      // 1. Snake Survival red hazard frame
      if (gameMode === 'SNAKE_SURVIVAL') {
        const borderPulse = Math.sin(Date.now() / 150) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + borderPulse * 0.6})`;
        ctx.lineWidth = 4;
        ctx.strokeRect(1, 1, canvasDim - 2, canvasDim - 2);
      }

      // 2. Maze Escape barriers and Exit hub target
      if (gameMode === 'MAZE_ESCAPE') {
        generateMazeWalls().forEach(w => {
          const wx = w.x * cellSize;
          const wy = w.y * cellSize;
          
          ctx.fillStyle = '#065f46'; 
          ctx.fillRect(wx + 1, wy + 1, cellSize - 2, cellSize - 2);

          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1;
          ctx.strokeRect(wx + 1.5, wy + 1.5, cellSize - 3, cellSize - 3);

          ctx.beginPath();
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
          ctx.moveTo(wx + 4, wy + 4);
          ctx.lineTo(wx + cellSize - 4, wy + cellSize - 4);
          ctx.stroke();
        });

        if (exitPortal) {
          const ex = exitPortal.x * cellSize;
          const ey = exitPortal.y * cellSize;
          const pulse = Math.sin(Date.now() / 120) * 2.5;

          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 12 + pulse;
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.fillRect(ex + 1, ey + 1, cellSize - 2, cellSize - 2);
          ctx.shadowBlur = 0;

          ctx.strokeStyle = '#047857';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(ex + 2.5, ey + 2.5, cellSize - 5, cellSize - 5);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px Courier';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('EXIT', ex + cellSize / 2, ey + cellSize / 2);
        }
      }

      // 3. Shrinking Arena limits
      if (gameMode === 'SHRINKING_ARENA' && shrinkLevel > 0) {
        for (let x = 0; x < GRID_SIZE; x++) {
          for (let y = 0; y < GRID_SIZE; y++) {
            const isShrunk = x < shrinkLevel || x >= GRID_SIZE - shrinkLevel || y < shrinkLevel || y >= GRID_SIZE - shrinkLevel;
            if (isShrunk) {
              const cx = x * cellSize;
              const cy = y * cellSize;
              
              ctx.fillStyle = '#200808';
              ctx.fillRect(cx, cy, cellSize, cellSize);

              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 0.5;
              ctx.strokeRect(cx, cy, cellSize, cellSize);

              ctx.beginPath();
              ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
              ctx.moveTo(cx + 3, cy + 3);
              ctx.lineTo(cx + cellSize - 3, cy + cellSize - 3);
              ctx.stroke();
            }
          }
        }
      }

      // 4. Laser Walls warning rows & real-time beam pulses
      if (gameMode === 'LASER_WALLS') {
        lasers.forEach(l => {
          ctx.beginPath();
          if (l.status === 'WARNING') {
            const p = Math.sin(Date.now() / 50) > 0;
            ctx.strokeStyle = p ? 'rgba(234, 179, 8, 0.85)' : 'rgba(234, 179, 8, 0.15)';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([5, 5]);
          } else {
            ctx.strokeStyle = '#ff007f';
            ctx.lineWidth = 7;
            ctx.setLineDash([]);
            ctx.shadowColor = '#ff007f';
            ctx.shadowBlur = 18;
          }

          if (l.type === 'ROW') {
            const ly = l.coordinate * cellSize + cellSize / 2;
            ctx.moveTo(0, ly);
            ctx.lineTo(canvasDim, ly);
          } else {
            const lx = l.coordinate * cellSize + cellSize / 2;
            ctx.moveTo(lx, 0);
            ctx.lineTo(lx, canvasDim);
          }
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;
        });
      }

      // 5. Obstacle Rush blocks spawned during play
      if (gameMode === 'OBSTACLE_RUSH') {
        rushObstacles.forEach(o => {
          const ox = o.x * cellSize;
          const oy = o.y * cellSize;

          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(ox + 1, oy + 1, cellSize - 2, cellSize - 2);

          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 1;
          ctx.strokeRect(ox + 1.5, oy + 1.5, cellSize - 3, cellSize - 3);

          ctx.fillStyle = '#fca5a5';
          ctx.fillRect(ox + 3, oy + 3, 2, 2);
        });
      }

      // Draw Small Egg (1 point food) - Glowing teal electric egg
      ctx.shadowColor = '#06b6d4'; 
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#22d3ee'; 
      const sx = smallEgg.x * cellSize + cellSize / 2;
      const sy = smallEgg.y * cellSize + cellSize / 2;
      ctx.beginPath();
      ctx.arc(sx, sy, cellSize / 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Big Egg (5 points food, larger yellow glowing star) if active
      if (bigEgg) {
        const pulsation = Math.sin(Date.now() / 120) * 1.5;
        ctx.shadowColor = '#fbbf24'; 
        ctx.shadowBlur = 16 + pulsation;
        ctx.fillStyle = '#fbbf24'; 
        
        const bx = bigEgg.x * cellSize + cellSize / 2;
        const by = bigEgg.y * cellSize + cellSize / 2;
        
        ctx.beginPath();
        ctx.arc(bx, by, (cellSize * 0.72) + pulsation * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Gleaming white star core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by, cellSize / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Render Snake with high-fidelity realistic reptile styling (Stable, non-shaking slither)
      snake.forEach((seg, index) => {
        const isHead = index === 0;
        
        // Keep the coordinates completely steady with NO shaking during run
        const px = seg.x * cellSize;
        const py = seg.y * cellSize;

        // Tail Tapering: Thins down smoothly towards the tail tip
        const segTaper = isHead ? 1.0 : Math.max(0.42, 1.0 - (index / snake.length) * 0.58);
        const segSize = cellSize * segTaper;
        const rOuter = segSize / 2;
        
        // 3D Spherical Radial Gradient
        const gradX = px + cellSize / 2 - rOuter * 0.22;
        const gradY = py + cellSize / 2 - rOuter * 0.22;
        const grad = ctx.createRadialGradient(
          gradX, gradY, rOuter * 0.1,
          px + cellSize / 2, py + cellSize / 2, rOuter
        );

        ctx.shadowBlur = isHead ? 14 : 0;
        ctx.shadowColor = '#ea580c';

        const stripeType = index % 4;

        if (isHead || stripeType === 0) {
          // Orange-red coral stripe
          grad.addColorStop(0, '#ffedd5'); 
          grad.addColorStop(0.2, '#f97316'); 
          grad.addColorStop(0.7, '#ea580c'); 
          grad.addColorStop(1, '#7c2d12'); 
        } else if (stripeType === 1 || stripeType === 3) {
          // Light Cream-Yellow stripe
          grad.addColorStop(0, '#fef9c3'); 
          grad.addColorStop(0.25, '#fcd34d'); 
          grad.addColorStop(0.75, '#eab308'); 
          grad.addColorStop(1, '#713f12'); 
        } else {
          // Obsidian Black stripe
          grad.addColorStop(0, '#9ca3af'); 
          grad.addColorStop(0.25, '#374151'); 
          grad.addColorStop(0.75, '#111827'); 
          grad.addColorStop(1, '#030712'); 
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px + cellSize / 2, py + cellSize / 2, rOuter, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Add physical scale curved ridge texture highlights
        if (!isHead) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.21)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(px + cellSize / 2, py + cellSize / 2, rOuter * 0.6, Math.PI * 1.25, Math.PI * 1.75);
          ctx.stroke();
        }

        // Draw detailed eyes, nostrils & wiggling tongue on the head segment
        if (isHead) {
          // Forked red tongue wiggles dynamically
          const tonguePeriod = (Date.now() % 700) < 320; 
          if (tonguePeriod && hasStarted && !isGameOver) {
            ctx.strokeStyle = '#ef4444'; 
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            
            let hx = px + cellSize / 2;
            let hy = py + cellSize / 2;
            let tx = hx;
            let ty = hy;
            
            const tongueLen = cellSize * 0.58;
            const tongueFork = cellSize * 0.18;
            
            let fork1X = 0, fork1Y = 0, fork2X = 0, fork2Y = 0;
            
            if (direction === 'UP') {
              ty = py - tongueLen;
              fork1X = tx - tongueFork; fork1Y = ty - tongueFork;
              fork2X = tx + tongueFork; fork2Y = ty - tongueFork;
            } else if (direction === 'DOWN') {
              ty = py + cellSize + tongueLen;
              fork1X = tx - tongueFork; fork1Y = ty + tongueFork;
              fork2X = tx + tongueFork; fork2Y = ty + tongueFork;
            } else if (direction === 'LEFT') {
              tx = px - tongueLen;
              fork1X = tx - tongueFork; fork1Y = ty - tongueFork;
              fork2X = tx - tongueFork; fork2Y = ty + tongueFork;
            } else if (direction === 'RIGHT') {
              tx = px + cellSize + tongueLen;
              fork1X = tx + tongueFork; fork1Y = ty - tongueFork;
              fork2X = tx + tongueFork; fork2Y = ty + tongueFork;
            }
            
            const startX = direction === 'UP' ? hx : (direction === 'DOWN' ? hx : (direction === 'LEFT' ? px : px + cellSize));
            const startY = direction === 'UP' ? py : (direction === 'DOWN' ? py + cellSize : (direction === 'LEFT' ? hy : hy));
            
            ctx.moveTo(startX, startY);
            ctx.lineTo(tx, ty);
            ctx.lineTo(fork1X, fork1Y);
            ctx.moveTo(tx, ty);
            ctx.lineTo(fork2X, fork2Y);
            ctx.stroke();
          }

          // Glowing gorgeous Cartoon Blue Eyes (white eyeball, blue iris, black pupil, highlights)
          let eye1 = { x: 0, y: 0 };
          let eye2 = { x: 0, y: 0 };

          const leftOffset = cellSize * 0.28;
          const rightOffset = cellSize * 0.72;

          switch (direction) {
            case 'UP':
              eye1 = { x: px + leftOffset, y: py + leftOffset };
              eye2 = { x: px + rightOffset, y: py + leftOffset };
              break;
            case 'DOWN':
              eye1 = { x: px + leftOffset, y: py + rightOffset };
              eye2 = { x: px + rightOffset, y: py + rightOffset };
              break;
            case 'LEFT':
              eye1 = { x: px + leftOffset, y: py + leftOffset };
              eye2 = { x: px + leftOffset, y: py + rightOffset };
              break;
            case 'RIGHT':
              eye1 = { x: px + rightOffset, y: py + leftOffset };
              eye2 = { x: px + rightOffset, y: py + rightOffset };
              break;
          }

          // 1. White Large Eyeball scleras (with a thin border)
          ctx.strokeStyle = '#7c2d12';
          ctx.lineWidth = 1;
          ctx.fillStyle = '#ffffff';

          ctx.beginPath();
          ctx.arc(eye1.x, eye1.y, cellSize * 0.20, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(eye2.x, eye2.y, cellSize * 0.20, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 2. Beautiful Cartoon Blue Iris
          ctx.fillStyle = '#2563eb'; // Deep Vivid Royal Blue
          ctx.beginPath();
          ctx.arc(eye1.x, eye1.y, cellSize * 0.13, 0, Math.PI * 2);
          ctx.arc(eye2.x, eye2.y, cellSize * 0.13, 0, Math.PI * 2);
          ctx.fill();

          // 3. Black Pupils
          ctx.fillStyle = '#111827';
          ctx.beginPath();
          ctx.arc(eye1.x, eye1.y, cellSize * 0.07, 0, Math.PI * 2);
          ctx.arc(eye2.x, eye2.y, cellSize * 0.07, 0, Math.PI * 2);
          ctx.fill();

          // 4. Glossy Specular shine Spot Reflections
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(eye1.x - cellSize * 0.04, eye1.y - cellSize * 0.04, cellSize * 0.03, 0, Math.PI * 2);
          ctx.arc(eye2.x - cellSize * 0.04, eye2.y - cellSize * 0.04, cellSize * 0.03, 0, Math.PI * 2);
          ctx.fill();

          // Physical Nostrils
          ctx.fillStyle = '#7c2d12';
          let nose1 = { x: 0, y: 0 };
          let nose2 = { x: 0, y: 0 };
          const noseOffset = cellSize * 0.13;
          
          if (direction === 'UP') {
            nose1 = { x: px + cellSize * 0.38, y: py + noseOffset };
            nose2 = { x: px + cellSize * 0.62, y: py + noseOffset };
          } else if (direction === 'DOWN') {
            nose1 = { x: px + cellSize * 0.38, y: py + cellSize - noseOffset };
            nose2 = { x: px + cellSize * 0.62, y: py + cellSize - noseOffset };
          } else if (direction === 'LEFT') {
            nose1 = { x: px + noseOffset, y: py + cellSize * 0.38 };
            nose2 = { x: px + noseOffset, y: py + cellSize * 0.62 };
          } else if (direction === 'RIGHT') {
            nose1 = { x: px + cellSize - noseOffset, y: py + cellSize * 0.38 };
            nose2 = { x: px + cellSize - noseOffset, y: py + cellSize * 0.62 };
          }
          ctx.beginPath();
          ctx.arc(nose1.x, nose1.y, cellSize * 0.04, 0, Math.PI * 2);
          ctx.arc(nose2.x, nose2.y, cellSize * 0.04, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [snake, smallEgg, bigEgg, canvasDim, direction, speedMs, hasStarted, isGameOver, eggsEaten, gameMode, lasers, rushObstacles, exitPortal, shrinkLevel, generateMazeWalls]);

  // Restart values
  const handleRestart = () => {
    const defaultSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setSnake(defaultSnake);
    setDirection('UP');
    setNextDirection('UP');
    setScore(0);
    setEggsEaten(0);
    setSmallEggsEatenInCycle(0);
    setIsGameOver(false);
    setBigEgg(null);
    setSmallEgg(generateNewFoodPosition(defaultSnake));
    setHasStarted(false);
    setIsPaused(false);

    // Reset game-mode specific parameters
    setTickCount(0);
    setShrinkLevel(0);
    setLasers([]);
    setRushObstacles([]);

    if (gameMode === 'MAZE_ESCAPE') {
      const walls = generateMazeWalls();
      let targetExitPortal: Position | null = null;
      let exitFound = false;
      let limit = 0;
      while (!exitFound && limit < 100) {
        const rx = Math.floor(Math.random() * GRID_SIZE);
        const ry = Math.floor(Math.random() * GRID_SIZE);
        const hitsSnake = defaultSnake.some(s => s.x === rx && s.y === ry);
        const hitsWall = walls.some(w => w.x === rx && w.y === ry);
        if (!hitsSnake && !hitsWall) {
          targetExitPortal = { x: rx, y: ry };
          exitFound = true;
        }
        limit++;
      }
      setExitPortal(targetExitPortal || { x: 18, y: 18 });
    } else {
      setExitPortal(null);
    }
  };

  const handleReplayDirectly = () => {
    const defaultSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setSnake(defaultSnake);
    setDirection('UP');
    setNextDirection('UP');
    setScore(0);
    setEggsEaten(0);
    setSmallEggsEatenInCycle(0);
    setIsGameOver(false);
    setBigEgg(null);
    setSmallEgg(generateNewFoodPosition(defaultSnake));
    setHasStarted(true);
    setIsPaused(false);

    // Reset game-mode specific parameters
    setTickCount(0);
    setShrinkLevel(0);
    setLasers([]);
    setRushObstacles([]);

    if (gameMode === 'MAZE_ESCAPE') {
      const walls = generateMazeWalls();
      let targetExitPortal: Position | null = null;
      let exitFound = false;
      let limit = 0;
      while (!exitFound && limit < 100) {
        const rx = Math.floor(Math.random() * GRID_SIZE);
        const ry = Math.floor(Math.random() * GRID_SIZE);
        const hitsSnake = defaultSnake.some(s => s.x === rx && s.y === ry);
        const hitsWall = walls.some(w => w.x === rx && w.y === ry);
        if (!hitsSnake && !hitsWall) {
          targetExitPortal = { x: rx, y: ry };
          exitFound = true;
        }
        limit++;
      }
      setExitPortal(targetExitPortal || { x: 18, y: 18 });
    } else {
      setExitPortal(null);
    }

    playStartSound();
  };

  const handleStartGame = () => {
    setHasStarted(true);
    playStartSound();
  };

  return (
    <div id="active-play-container" className="w-full flex flex-col items-center gap-6">
      
      {/* Top dashboard control metrics - simplified & clean */}
      <div className="w-full max-w-md flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <button
          id="btn-back-home"
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors bg-slate-950 border border-slate-800/80 px-3.5 py-2 rounded-xl cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
          {hasStarted && !isGameOver && (
            <button
              id="btn-pause-game"
              onClick={() => setIsPaused(!isPaused)}
              className={`flex items-center gap-1 font-mono text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                isPaused 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700/80 shadow-sm'
              }`}
              title={isPaused ? 'Resume Game' : 'Pause Game'}
            >
              {isPaused ? 'RESUME' : 'PAUSE'}
            </button>
          )}

          <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full uppercase border ${
            difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {difficulty}
          </span>
          <button
            id="btn-board-mute"
            onClick={toggleMute}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-950 border border-slate-800 transition-colors"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main interactive grid stage */}
      <div className={`w-full max-w-md flex flex-col items-center border-2 rounded-3xl p-5 relative transition-all duration-700 ${
        eggsEaten >= 2 
          ? 'bg-gradient-to-b from-slate-900 to-indigo-950/50 border-indigo-500/40 shadow-[0_0_35px_rgba(99,102,241,0.22)]' 
          : 'bg-slate-900 border-slate-800 shadow-2xl'
      }`} ref={containerRef}>
        
        {/* Dynamic score dashboard panel on top */}
        <div className="w-full grid grid-cols-3 gap-2.5 mb-5 text-center">
          <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Score</span>
            <span id="stat-score" className="text-xl font-black font-mono text-teal-400">
              {score}
            </span>
          </div>
          <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Level</span>
            <span id="stat-level" className="text-xl font-black font-mono text-amber-400 block animate-pulse">
              {currentLevel}/10
            </span>
          </div>
          <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Eggs</span>
            <span id="stat-eggs" className="text-xl font-black font-mono text-sky-400">
              {eggsEaten} 🥚
            </span>
          </div>
        </div>

        {/* Canvas Arena block */}
        <div className="relative border-4 border-slate-950 rounded-2xl overflow-hidden shadow-2xl bg-slate-950" style={{ width: canvasDim, height: canvasDim }}>
          <canvas 
            id="game-canvas"
            ref={canvasRef} 
            style={{ width: canvasDim, height: canvasDim }}
            className="block"
          />

          <AnimatePresence>
            {isPaused && !isGameOver && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsPaused(false)}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-5 z-20 cursor-pointer text-center"
              >
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-xs bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-2xl space-y-4 cursor-default relative overflow-hidden text-center"
                >
                  {/* Glowing background accent */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/10 rounded-full blur-[30px] pointer-events-none" />

                  {/* Icon Indicator */}
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-400">
                    <div className="flex gap-1 justify-center items-center">
                      <div className="w-2.5 h-5 bg-amber-400 rounded-sm animate-pulse" />
                      <div className="w-2.5 h-5 bg-amber-400 rounded-sm animate-pulse" />
                    </div>
                  </div>

                  {/* Header info */}
                  <div>
                    <span className="text-amber-500 font-mono text-[9px] uppercase tracking-widest font-black block">
                      {gameMode.replace('_', ' ')}
                    </span>
                    <h3 className="text-lg font-sans font-black text-slate-100 uppercase tracking-wide mt-0.5">
                      Game Paused
                    </h3>
                  </div>

                  {/* Segmented brief stats overview */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/85 border border-slate-800/80 px-3 py-2 rounded-xl text-left">
                    <div>
                      <span className="text-[8px] text-slate-500 font-mono uppercase block">Score</span>
                      <span className="text-sm font-black font-mono text-teal-400">{score}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-500 font-mono uppercase block">Eggs</span>
                      <span className="text-sm font-black font-mono text-sky-400">{eggsEaten} 🥚</span>
                    </div>
                  </div>

                  {/* Interactive Button list */}
                  <div className="flex flex-col gap-2.5 pt-1">
                    {/* 1. Resume Game */}
                    <button
                      id="btn-pause-resume"
                      onClick={() => {
                        setIsPaused(false);
                        playStartSound();
                      }}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-450 text-slate-950 font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer text-xs uppercase tracking-wider font-mono transition-transform active:scale-97"
                    >
                      ▶ Resume Game
                    </button>

                    {/* 2. Restart Level */}
                    <button
                      id="btn-pause-restart"
                      onClick={() => {
                        handleReplayDirectly();
                      }}
                      className="w-full bg-slate-950 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-amber-400 font-extrabold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-97 cursor-pointer text-xs uppercase tracking-wider font-mono"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-450 animate-spin-slow" />
                      Restart Level
                    </button>

                    {/* 3. Quit to Menu */}
                    <button
                      id="btn-pause-quit"
                      onClick={() => {
                        onBackToMenu();
                      }}
                      className="w-full bg-slate-950 border border-slate-850 hover:bg-rose-950/20 hover:border-rose-900/30 text-rose-450 font-extrabold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-97 cursor-pointer text-xs uppercase tracking-wider font-mono"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-rose-400" />
                      Quit to Menu
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {!hasStarted && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 z-15"
              >
                <div className="text-center">
                  <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest font-black">ARENA INCOMING</span>
                  <h3 className="text-2xl font-display font-medium text-slate-100 mt-1 mb-2">
                    Level {currentLevel} Started
                  </h3>
                  <p className="text-slate-400 text-xs mb-6 font-sans">
                    Use WASD or arrow keys. Snake moves slowly initially. Wrap borders safely but don't hit your own tail!
                  </p>
                  <button
                    id="btn-play-run"
                    onClick={handleStartGame}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-450 text-slate-950 font-black py-4 px-8 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer text-sm"
                  >
                    Start Game
                  </button>
                </div>
              </motion.div>
            )}

            {isGameOver && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-red-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 z-15 text-center pointer-events-none select-none"
              >
                <div className="animate-bounce">
                  <div className="w-12 h-12 bg-rose-600/90 border-2 border-white rounded-full flex items-center justify-center mx-auto mb-2 text-white shadow-[0_0_15px_rgba(239,68,68,0.7)]">
                    <Skull className="w-6 h-6 animate-pulse" />
                  </div>
                </div>
                <span className="text-rose-450 font-mono text-[9px] uppercase tracking-widest font-black text-shadow">DIED IN ARENA</span>
                <h3 className="text-xl font-display font-black text-white uppercase tracking-wide text-shadow-md">CRASHED OUT!</h3>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Retro circular directional mobile D-Pad helper */}
        {!isGameOver ? (
          <div className="w-full max-w-xs mt-6">
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              {/* Inner aesthetic solid black disk */}
              <div className="absolute inset-4 rounded-full bg-slate-950 border border-slate-850" />

              {/* UP button */}
              <button
                id="pad-up"
                onClick={() => { if (direction !== 'DOWN') { setNextDirection('UP'); playMoveSound(); } }}
                disabled={!hasStarted || isGameOver}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-11 h-11 rounded-xl bg-slate-800 border border-slate-750 hover:bg-slate-700 active:bg-emerald-500 active:text-slate-950 flex items-center justify-center text-slate-300 transition-colors shadow-md disabled:opacity-40 cursor-pointer"
                title="Steer Up"
              >
                ▲
              </button>

              {/* DOWN button */}
              <button
                id="pad-down"
                onClick={() => { if (direction !== 'UP') { setNextDirection('DOWN'); playMoveSound(); } }}
                disabled={!hasStarted || isGameOver}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-11 h-11 rounded-xl bg-slate-800 border border-slate-750 hover:bg-slate-700 active:bg-emerald-500 active:text-slate-950 flex items-center justify-center text-slate-300 transition-colors shadow-md disabled:opacity-40 cursor-pointer"
                title="Steer Down"
              >
                ▼
              </button>

              {/* LEFT button */}
              <button
                id="pad-left"
                onClick={() => { if (direction !== 'RIGHT') { setNextDirection('LEFT'); playMoveSound(); } }}
                disabled={!hasStarted || isGameOver}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-slate-800 border border-slate-750 hover:bg-slate-700 active:bg-emerald-500 active:text-slate-950 flex items-center justify-center text-slate-300 transition-colors shadow-md disabled:opacity-40 cursor-pointer"
                title="Steer Left"
              >
                ◀
              </button>

              {/* RIGHT button */}
              <button
                id="pad-right"
                onClick={() => { if (direction !== 'LEFT') { setNextDirection('RIGHT'); playMoveSound(); } }}
                disabled={!hasStarted || isGameOver}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-slate-800 border border-slate-750 hover:bg-slate-700 active:bg-emerald-500 active:text-slate-950 flex items-center justify-center text-slate-300 transition-colors shadow-md disabled:opacity-40 cursor-pointer"
                title="Steer Right"
              >
                ▶
              </button>

              <div className="absolute w-10 h-10 rounded-full bg-slate-900 border border-slate-800 text-[9px] text-slate-500 uppercase tracking-tighter flex items-center justify-center">
                CORE
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-4 bg-gradient-to-b from-[#18120e] to-[#0c0908] border-2 border-orange-500/30 p-5 rounded-3xl flex flex-col gap-4 text-center relative overflow-hidden"
          >
            {/* Ambient subtle glow background */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-orange-500/10 rounded-full blur-[40px] pointer-events-none" />

            {/* Expansive Score Header Dashboard */}
            <div className="flex items-center justify-between border-b border-orange-500/10 pb-3 z-10 relative">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-550 animate-pulse">
                  <Skull className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] text-orange-500 font-mono uppercase tracking-widest font-black block">SESSION SUMMARY</span>
                  <h3 className="text-lg font-display font-black text-white leading-tight">CRASHED OUT!</h3>
                </div>
              </div>
              
              <div className="bg-orange-500/10 border border-orange-500/20 px-3.5 py-1.5 rounded-xl text-right">
                <span className="text-[9px] text-orange-400 font-mono uppercase block">Your Score</span>
                <span className="text-xl font-mono font-black text-amber-400">{score}</span>
              </div>
            </div>

            {/* Expanded elegant stats grid */}
            <div className="grid grid-cols-2 gap-3 mt-1 text-left z-10 relative">
              <div className="bg-[#050302] border border-orange-500/15 p-3 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-mono uppercase block">Total Eggs Eaten</span>
                <span className="text-lg font-black font-mono text-emerald-450 mt-1 flex items-center gap-1.5">
                  {eggsEaten} <span className="text-xs">🥚</span>
                </span>
              </div>

              <div className="bg-[#050302] border border-orange-500/15 p-3 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-mono uppercase block">Peak Level</span>
                <span className="text-lg font-black font-mono text-sky-400 mt-1">
                  Lvl {currentLevel}
                </span>
              </div>

              <div className="bg-[#050302] border border-orange-500/15 p-3 rounded-2xl flex flex-col justify-between col-span-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-slate-400 font-mono uppercase">Personal Record</span>
                  <span className="text-xs font-mono font-bold text-amber-500/90 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> HIGH SCORE
                  </span>
                </div>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="text-[11px] text-slate-400">Previous best in this arena:</span>
                  <span className="text-lg font-black font-mono text-white">{highScore}</span>
                </div>
              </div>
            </div>

            {/* Replay and Exit control buttons with massive click targets */}
            <div className="flex flex-col gap-3 w-full mt-2 z-10 relative">
              <button
                id="btn-retry-loop"
                onClick={handleReplayDirectly}
                className="group relative overflow-hidden bg-gradient-to-r from-[#8eff37] via-[#22c55e] to-[#15803d] text-white font-extrabold font-[Outfit] text-base py-3.5 px-6 rounded-2xl tracking-widest uppercase transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_6px_20px_rgba(34,197,94,0.3)] border-2 border-white/80 skew-x-[-4deg]"
              >
                <span className="absolute inset-x-0 top-0 h-[1.5px] bg-white/30" />
                <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none" />
                <span className="relative flex items-center justify-center gap-2 -skew-x-[-4deg] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)]">
                  <RotateCcw className="w-4.5 h-4.5 text-white animate-spin-slow" />
                  REPLAY GAME
                </span>
              </button>

              <button
                id="btn-quit-hub"
                onClick={onBackToMenu}
                className="group relative overflow-hidden bg-gradient-to-r from-[#dc2626] to-[#991b1b] text-white font-extrabold font-[Outfit] text-xs py-3 px-6 rounded-2xl tracking-widest uppercase transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_4px_12px_rgba(220,38,38,0.2)] border border-white/40 skew-x-[-4deg]"
              >
                <span className="relative flex items-center justify-center gap-2 -skew-x-[-4deg] drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.5)]">
                  <ArrowLeft className="w-4 h-4 text-white" />
                  EXIT TO MAIN MENU
                </span>
              </button>
            </div>
          </motion.div>
        )}

      </div>

    </div>
  );
}
