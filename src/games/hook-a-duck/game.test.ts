import { describe, expect, it } from 'vitest';
import {
  CASTS_PER_ROUND,
  DUCK_SPEED,
  GENTLE_SPEED,
  HOOK_TOP,
  HOOK_X,
  RING_BOTTOM,
  RING_OFFSET,
  RING_TOP,
  SINK_TIME,
  WATER_Y,
  castResult,
  createState,
  hold,
  lower,
  ringX,
  step,
  type HookADuckState,
} from './game';
import { lookFor } from './skins';

/** A state with one duck whose ring is right under the hook. */
function oneDuckUnderHook(points = 30): HookADuckState {
  const state = createState();
  state.ducks = [{ x: HOOK_X - RING_OFFSET, points, sink: 0 }];
  return state;
}

/** Reels the hook back up after a cast. */
function reelIn(state: HookADuckState) {
  for (let i = 0; i < 100 && state.hook.phase === 'reeling'; i++) step(state, 0.05);
}

describe('hook a duck', () => {
  it('starts with every cast left, no score and the hook up', () => {
    const state = createState();
    expect(state.castsLeft).toBe(CASTS_PER_ROUND);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.hook.y).toBe(HOOK_TOP);
    expect(state.ducks.length).toBeGreaterThan(0);
  });

  it('floats the ducks along the stream and round in a loop', () => {
    const state = createState();
    const before = state.ducks.map((d) => d.x);
    step(state, 1);
    expect(state.ducks[0].x).toBe(before[0] + DUCK_SPEED);
    for (let i = 0; i < 200; i++) step(state, 0.05);
    for (const duck of state.ducks) {
      expect(duck.x).toBeGreaterThan(-100);
      expect(duck.x).toBeLessThan(900);
    }
  });

  it('only moves the hook down while the player is lowering it', () => {
    const state = createState();
    state.ducks = [];
    step(state, 0.1);
    expect(state.hook.y).toBe(HOOK_TOP);
    lower(state);
    step(state, 0.1);
    expect(state.hook.y).toBeGreaterThan(HOOK_TOP);
    hold(state);
    const held = state.hook.y;
    step(state, 0.1);
    expect(state.hook.y).toBe(held);
  });

  it('catches a duck when the hook stops gently at the ring', () => {
    const state = oneDuckUnderHook(30);
    state.hook.y = (RING_TOP + RING_BOTTOM) / 2;
    state.hook.speed = GENTLE_SPEED / 2;
    expect(castResult(state)?.result).toBe('caught');
    lower(state);
    step(state, 0);
    expect(state.score).toBe(30);
    expect(state.castsLeft).toBe(CASTS_PER_ROUND - 1);
  });

  it('misses when the hook comes down too fast', () => {
    const state = oneDuckUnderHook();
    state.hook.y = RING_TOP + 1;
    state.hook.speed = GENTLE_SPEED + 50;
    expect(castResult(state)?.result).toBe('too-fast');
    lower(state);
    step(state, 0);
    expect(state.score).toBe(0);
    expect(state.ducks[0].sink).toBeGreaterThan(0);
    expect(state.castsLeft).toBe(CASTS_PER_ROUND - 1);
  });

  it('misses and sinks the duck when the hook lands right on top of it', () => {
    const state = createState();
    // The hook is over the duck's back, not its ring.
    state.ducks = [{ x: HOOK_X + 20, points: 20, sink: 0 }];
    state.hook.y = RING_BOTTOM + 5;
    expect(castResult(state)?.result).toBe('landed-on-duck');
    lower(state);
    step(state, 0);
    expect(state.score).toBe(0);
    expect(state.ducks[0].sink).toBeCloseTo(SINK_TIME);
  });

  it("can't catch a duck while it's still sinking", () => {
    const state = oneDuckUnderHook();
    state.ducks[0].sink = SINK_TIME;
    state.hook.y = (RING_TOP + RING_BOTTOM) / 2;
    expect(castResult(state)).toBeUndefined();
  });

  it('uses up a cast when the hook splashes into empty water', () => {
    const state = createState();
    state.ducks = [];
    state.hook.y = WATER_Y;
    expect(castResult(state)?.result).toBe('splash');
    lower(state);
    step(state, 0);
    expect(state.castsLeft).toBe(CASTS_PER_ROUND - 1);
  });

  it('can only be lowered at the start of a cast', () => {
    const state = createState();
    state.hook.phase = 'reeling';
    expect(lower(state)).toBe(false);
    reelIn(state);
    expect(state.hook.phase).toBe('casting');
    expect(lower(state)).toBe(true);
  });

  it('catches a duck when the player lowers the hook gently onto its ring', () => {
    const state = oneDuckUnderHook(50);
    // The duck floats on while the hook drops, so start it just short of the hook.
    state.ducks[0].x -= 8;
    state.hook.y = RING_TOP - 4;
    lower(state);
    for (let i = 0; i < 20 && state.hook.phase === 'casting'; i++) step(state, 0.02);
    expect(state.score).toBe(50);
  });

  it('catches nothing while the hook just hangs at the ring', () => {
    const state = oneDuckUnderHook();
    state.hook.y = (RING_TOP + RING_BOTTOM) / 2;
    step(state, 0.05);
    expect(state.score).toBe(0);
    expect(state.castsLeft).toBe(CASTS_PER_ROUND);
  });

  it('misses when the hook is dropped all the way down in one go', () => {
    const state = oneDuckUnderHook();
    state.ducks[0].x = -1000; // the duck arrives once the hook is already fast
    lower(state);
    while (state.hook.y < RING_TOP - 30) step(state, 0.02);
    state.ducks[0].x = HOOK_X - RING_OFFSET;
    for (let i = 0; i < 200 && state.hook.phase === 'casting'; i++) step(state, 0.001);
    expect(state.score).toBe(0);
    expect(state.castsLeft).toBe(CASTS_PER_ROUND - 1);
  });

  it('ends the round after the last cast is reeled in', () => {
    const state = createState();
    state.ducks = [];
    state.castsLeft = 1;
    state.hook.y = WATER_Y;
    lower(state);
    step(state, 0);
    expect(state.castsLeft).toBe(0);
    expect(state.phase).toBe('playing');
    reelIn(state);
    expect(state.phase).toBe('over');
    expect(lower(state)).toBe(false);
  });

  it('scores the number on the base of the duck it catches', () => {
    for (const points of [10, 20, 50]) {
      const state = oneDuckUnderHook(points);
      state.hook.y = RING_TOP;
      lower(state);
      step(state, 0);
      expect(state.score).toBe(points);
    }
    expect(ringX({ x: 100, points: 10, sink: 0 })).toBe(100 + RING_OFFSET);
  });

  it('has a Halloween look and draws the classic way for other skins', () => {
    expect(lookFor('halloween').duck).toBeTruthy();
    expect(lookFor('halloween').backdrop).toBeTruthy();
    expect(lookFor('classic')).toEqual({});
  });
});
