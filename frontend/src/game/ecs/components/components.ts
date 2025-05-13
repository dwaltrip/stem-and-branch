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
