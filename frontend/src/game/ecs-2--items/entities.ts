import { Direction, Entity } from './types';
import { 
  createEntity, 
  addPosition, 
  addMiningDrill, 
  addTransportTube, 
  addTimer 
} from './world';

export function createMiningDrill(x: number, y: number, outputDirection: Direction): Entity {
  const entity = createEntity();
  
  addPosition(entity, { x, y });
  addMiningDrill(entity, {
    outputDirection,
    ironOreCount: 0,
    maxCapacity: 10,
    miningInterval: 60
  });
  addTimer(entity, { ticksRemaining: 60 });
  
  return entity;
}

export function createTransportTube(x: number, y: number, direction: Direction): Entity {
  const entity = createEntity();
  
  addPosition(entity, { x, y });
  addTransportTube(entity, {
    direction,
    ironOreCount: 0,
    maxCapacity: 5,
    transportInterval: 30
  });
  addTimer(entity, { ticksRemaining: 30 });
  
  return entity;
}