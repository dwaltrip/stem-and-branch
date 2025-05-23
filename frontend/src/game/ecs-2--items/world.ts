import { Entity } from './types';
import { Position, MiningDrill, TransportTube, Timer } from './components';

// Simple component storage
const entities = new Set<Entity>();
const positions = new Map<Entity, Position>();
const miningDrills = new Map<Entity, MiningDrill>();
const transportTubes = new Map<Entity, TransportTube>();
const timers = new Map<Entity, Timer>();

let nextEntityId = 1;

export function createEntity(): Entity {
  const entity = nextEntityId++;
  entities.add(entity);
  return entity;
}

export function addPosition(entity: Entity, component: Position): void {
  positions.set(entity, component);
}

export function addMiningDrill(entity: Entity, component: MiningDrill): void {
  miningDrills.set(entity, component);
}

export function addTransportTube(entity: Entity, component: TransportTube): void {
  transportTubes.set(entity, component);
}

export function addTimer(entity: Entity, component: Timer): void {
  timers.set(entity, component);
}

export function getPosition(entity: Entity): Position | undefined {
  return positions.get(entity);
}

export function getMiningDrill(entity: Entity): MiningDrill | undefined {
  return miningDrills.get(entity);
}

export function getTransportTube(entity: Entity): TransportTube | undefined {
  return transportTubes.get(entity);
}

export function getTimer(entity: Entity): Timer | undefined {
  return timers.get(entity);
}

// Query functions
export function queryEntitiesWithTimer(): Entity[] {
  return [...entities].filter(e => timers.has(e));
}

export function queryEntitiesWithTransportTube(): Entity[] {
  return [...entities].filter(e => transportTubes.has(e) && timers.has(e));
}

export function queryEntitiesWithMiningDrill(): Entity[] {
  return [...entities].filter(e => miningDrills.has(e) && timers.has(e) && positions.has(e));
}

export function queryEntitiesWithPosition(): Entity[] {
  return [...entities].filter(e => positions.has(e) && transportTubes.has(e));
}