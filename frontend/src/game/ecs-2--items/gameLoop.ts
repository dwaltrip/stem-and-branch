import { timerSystem, transportSystem, miningSystem } from './systems';

export function gameTick(): void {
  timerSystem();
  transportSystem();
  miningSystem();
}

export function startGameLoop(): void {
  // TODO: integrate with main game loop at 10 ticks per second
  setInterval(gameTick, 100);
}