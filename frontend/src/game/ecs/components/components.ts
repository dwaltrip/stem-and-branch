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

// ====== Intent Components ======
// These components represent player intentions before they're executed

// Intent to move in a direction
export const MoveIntent = defineComponent({
  x: Types.f32, // x direction, normalized (-1 to 1)
  y: Types.f32, // y direction, normalized (-1 to 1)
  duration: Types.f32, // How long this intent should last (in seconds)
});

// Intent to build something
export const BuildIntent = defineComponent({
  type: Types.ui8, // BuildingType to place
  gridX: Types.ui16, // Target grid position X
  gridY: Types.ui16, // Target grid position Y
});

// Intent to remove/demolish a building
export const RemoveIntent = defineComponent({
  gridX: Types.ui16, // Target grid position X
  gridY: Types.ui16, // Target grid position Y
});

// Intent to interact with something at a position
export const InteractIntent = defineComponent({
  gridX: Types.ui16, // Target grid position X
  gridY: Types.ui16, // Target grid position Y
});

// Intent to toggle inventory, no additional data needed
export const ToggleInventoryIntent = defineComponent();
