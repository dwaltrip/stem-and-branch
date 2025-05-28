import { IWorld } from 'bitecs';
import { TerrainType } from './terrain/TerrainTypes';

export interface TerrainProvider {
  getTerrainAt: (gridX: number, gridY: number) => TerrainType;
  isValidPosition: (gridX: number, gridY: number) => boolean;
  isValidBuildPosition?: (world: IWorld, gridX: number, gridY: number, buildingType: number) => boolean;
}