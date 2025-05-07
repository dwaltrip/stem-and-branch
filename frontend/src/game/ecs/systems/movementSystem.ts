import { defineQuery, IWorld } from 'bitecs';
import { Position, Velocity, PlayerControlled } from '../components/components';
import { InputManager } from '../../input/InputManager';
import { GRID, PLAYER } from '../../GameConstants';
import { TerrainType } from '../../terrain/TerrainTypes';

// Need the map data to check terrain
type TerrainProvider = {
  getTerrainAt: (gridX: number, gridY: number) => TerrainType;
  isValidPosition: (gridX: number, gridY: number) => boolean;
}

export const movableQuery = defineQuery([Position, Velocity]);
export const playerQuery = defineQuery([Position, Velocity, PlayerControlled]);

export function playerInputSystem(world: IWorld, inputManager: InputManager) {
  const playerEntities = playerQuery(world);
  
  for (let i = 0; i < playerEntities.length; i++) {
    const entity = playerEntities[i];
    
    const movement = inputManager.getMovementVector();

    // Just set raw input for now - speed will be applied in movement system
    Velocity.x[entity] = movement.x;
    Velocity.y[entity] = movement.y;
  }
 
  return world;
}

export function movementSystem(world: IWorld, deltaTime: number, terrainProvider?: TerrainProvider) {
  // Get all entities with position and velocity
  const entities = movableQuery(world);
  
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    
    // Current position in grid coordinates
    const gridX = Math.floor(Position.x[entity] / GRID.SIZE);
    const gridY = Math.floor(Position.y[entity] / GRID.SIZE);
    
    // Base speed
    let speed = PLAYER.BASE_SPEED;
    
    // Adjust speed based on terrain if we have a terrain provider
    if (terrainProvider) {
      const terrainType = terrainProvider.getTerrainAt(gridX, gridY);
      
      if (terrainType === TerrainType.SAND) {
        speed *= PLAYER.SAND_SPEED_MULTIPLIER;
      }
    }
    
    // Calculate potential next positions
    let nextX = gridX;
    let nextY = gridY;
    
    if (Velocity.x[entity] !== 0) {
      nextX = Math.floor((Position.x[entity] + Velocity.x[entity] * speed * deltaTime) / GRID.SIZE);
    }
    
    if (Velocity.y[entity] !== 0) {
      nextY = Math.floor((Position.y[entity] + Velocity.y[entity] * speed * deltaTime) / GRID.SIZE);
    }
    
    // Check if next position is valid
    let canMoveX = true;
    let canMoveY = true;
    
    if (terrainProvider) {
      canMoveX = terrainProvider.isValidPosition(nextX, gridY);
      canMoveY = terrainProvider.isValidPosition(gridX, nextY);
    }
    
    // Update position based on valid movements
    if (canMoveX && Velocity.x[entity] !== 0) {
      const newX = Position.x[entity] + Velocity.x[entity] * speed * deltaTime;
      // Keep within world bounds
      if (newX >= 0 && newX < GRID.MAP_WIDTH * GRID.SIZE) {
        Position.x[entity] = newX;
      }
    }
    
    if (canMoveY && Velocity.y[entity] !== 0) {
      const newY = Position.y[entity] + Velocity.y[entity] * speed * deltaTime;
      // Keep within world bounds
      if (newY >= 0 && newY < GRID.MAP_HEIGHT * GRID.SIZE) {
        Position.y[entity] = newY;
      }
    }
  }

  return world;
}
