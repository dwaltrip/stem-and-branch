import { defineComponent, Types } from 'bitecs';

export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32,
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
  }
};

// Building component for all buildings
export const Building = defineComponent({
  type: Types.ui8, // BuildingType enum value
  gridX: Types.ui16, // Grid position X
  gridY: Types.ui16, // Grid position Y
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
