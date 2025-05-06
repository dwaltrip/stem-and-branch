import { createWorld, addEntity, addComponent } from 'bitecs';
import { Position, Velocity, PlayerControlled } from './components/components';
import { GRID } from '../GameConstants';

// Create a single world instance
export const world = createWorld();

// x, y = initial position
export function createPlayerEntity(x: number, y: number): number {
  const entity = addEntity(world);

  addComponent(world, Position, entity);
  addComponent(world, Velocity, entity);
  addComponent(world, PlayerControlled, entity);
  
  Position.x[entity] = x;
  Position.y[entity] = y;
  Velocity.x[entity] = 0;
  Velocity.y[entity] = 0;
  
  return entity;
}

// Resets the ECS world (useful for scene restarts or state resets)
export function resetWorld() {
  // For now, just create a new world
  // In the future, we might want to clear entities instead
  return createWorld();
}
