import { Direction } from './types';
import { 
  queryEntitiesWithTimer, 
  queryEntitiesWithTransportTube, 
  queryEntitiesWithMiningDrill,
  queryEntitiesWithPosition,
  getTimer, 
  getTransportTube, 
  getMiningDrill, 
  getPosition 
} from './world';

export function timerSystem(): void {
  const entities = queryEntitiesWithTimer();
  
  for (const entity of entities) {
    const timer = getTimer(entity)!;
    if (timer.ticksRemaining > 0) {
      timer.ticksRemaining--;
    }
  }
}

export function transportSystem(): void {
  const entities = queryEntitiesWithTransportTube();
  
  for (const entity of entities) {
    const tube = getTransportTube(entity)!;
    const timer = getTimer(entity)!;
    
    if (timer.ticksRemaining === 0 && tube.ironOreCount > 0) {
      tube.ironOreCount--;
      timer.ticksRemaining = tube.transportInterval;
    }
  }
}

export function miningSystem(): void {
  const entities = queryEntitiesWithMiningDrill();
  
  for (const entity of entities) {
    const drill = getMiningDrill(entity)!;
    const timer = getTimer(entity)!;
    const position = getPosition(entity)!;
    
    // Mine when timer expires and storage not full
    if (timer.ticksRemaining === 0 && drill.ironOreCount < drill.maxCapacity) {
      drill.ironOreCount++;
      timer.ticksRemaining = drill.miningInterval;
    }
    
    // Attempt output every tick
    if (drill.ironOreCount > 0) {
      const targetTube = findConnectedTube(position, drill.outputDirection);
      if (targetTube && targetTube.ironOreCount < targetTube.maxCapacity) {
        drill.ironOreCount--;
        targetTube.ironOreCount++;
      }
    }
  }
}

// TODO: implement helper functions
function findConnectedTube(drillPos: any, outputDir: Direction): any {
  const targetPos = getAdjacentPosition(drillPos, outputDir);
  const tubeEntities = queryEntitiesWithPosition();
  
  for (const entity of tubeEntities) {
    const position = getPosition(entity)!;
    const tube = getTransportTube(entity)!;
    
    if (position.x === targetPos.x && position.y === targetPos.y) {
      const tubeInputSide = getOppositeDirection(tube.direction);
      if (tubeInputSide === outputDir) {
        return tube;
      }
    }
  }
  return null;
}

function getAdjacentPosition(pos: any, direction: Direction): any {
  // TODO: implement direction math
  return { x: pos.x + 1, y: pos.y };
}

function getOppositeDirection(direction: Direction): Direction {
  // TODO: implement direction opposites
  return Direction.WEST;
}