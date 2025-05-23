import { Direction } from './types';

export interface Position {
  x: number;
  y: number;
}

export interface MiningDrill {
  outputDirection: Direction;
  ironOreCount: number;
  maxCapacity: number;
  miningInterval: number;
}

export interface TransportTube {
  direction: Direction;
  ironOreCount: number;
  maxCapacity: number;
  transportInterval: number;
}

export interface Timer {
  ticksRemaining: number;
}