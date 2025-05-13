import { defineComponent, Types } from 'bitecs';

export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

// Resources that the player has collected
export const Resources = defineComponent({
  ironOre: Types.ui32, // Amount of iron ore the player has
});

// Empty component used as a tag
export const PlayerControlled = defineComponent();

// Building types enum
export enum BuildingType {
  MINING_DRILL = 0,
}

// Building definitions with static properties
export const BUILDING_DEFINITIONS = {
  [BuildingType.MINING_DRILL]: {
    name: 'Mining Drill',
    productionRate: 1, // Production cycles per second
    resourceType: 'ironOre', // Type of resource produced
    productionAmount: 1, // Amount of resource per production cycle
  }
};

// Building component for all buildings
export const Building = defineComponent({
  type: Types.ui8, // BuildingType enum value
  gridX: Types.ui16, // Grid position X
  gridY: Types.ui16, // Grid position Y
});

// Production component for buildings that produce resources
export const Production = defineComponent({
  resourceType: Types.ui8, // Type of resource produced
  rate: Types.f32, // Production cycles per second
  progress: Types.f32, // Current progress towards next production (0-1)
  active: Types.ui8, // Whether the building is currently active (0=inactive, 1=active)
});
