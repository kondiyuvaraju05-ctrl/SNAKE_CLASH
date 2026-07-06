export interface Position {
  x: number;
  y: number;
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type GameMode = 
  | 'CLASSIC' 
  | 'MAZE_ESCAPE' 
  | 'SHRINKING_ARENA' 
  | 'SNAKE_SURVIVAL' 
  | 'LASER_WALLS' 
  | 'OBSTACLE_RUSH';

export interface GameStats {
  score: number;
  eggsEaten: number;
  highScore: number;
  level: number;
}

