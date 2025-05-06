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
