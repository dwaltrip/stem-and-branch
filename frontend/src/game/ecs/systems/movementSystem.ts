import { defineQuery, IWorld } from 'bitecs';
import { Position, Velocity, PlayerControlled } from '../components/components';
import { InputManager } from '../../input/InputManager';
import { PLAYER } from '../../GameConstants';

export const movableQuery = defineQuery([Position, Velocity]);
export const playerQuery = defineQuery([Position, Velocity, PlayerControlled]);

export function playerInputSystem(world: IWorld, inputManager: InputManager) {
  const playerEntities = playerQuery(world);
  
  for (let i = 0; i < playerEntities.length; i++) {
    const entity = playerEntities[i];
    
    const movement = inputManager.getMovementVector();

    Velocity.x[entity] = movement.x * PLAYER.BASE_SPEED;
    Velocity.y[entity] = movement.y * PLAYER.BASE_SPEED;
  }
 
  return world;
}

export function movementSystem(world: IWorld, deltaTime: number) {
  // Get all entities with position and velocity
  const entities = movableQuery(world);
  
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    
    Position.x[entity] += Velocity.x[entity] * deltaTime;
    Position.y[entity] += Velocity.y[entity] * deltaTime;
  }

  return world;
}
