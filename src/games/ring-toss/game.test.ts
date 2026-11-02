import { describe, expect, it } from 'vitest';
import {
  FLIGHT_TIME,
  NECK_RADIUS,
  RINGS_PER_ROUND,
  THROWER,
  bottleAt,
  createState,
  step,
  swayOffset,
  throwRing,
} from './game';

describe('ring toss', () => {
  it('starts with a full set of rings and no score', () => {
    const state = createState();
    expect(state.ringsLeft).toBe(RINGS_PER_ROUND);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.bottles.length).toBeGreaterThan(0);
  });

  it('uses one ring per throw', () => {
    const state = createState();
    expect(throwRing(state, 400, 100)).toBe(true);
    expect(state.ringsLeft).toBe(RINGS_PER_ROUND - 1);
    expect(state.rings).toHaveLength(1);
  });

  it('cannot throw once the rings run out', () => {
    const state = createState();
    state.ringsLeft = 0;
    expect(throwRing(state, 400, 100)).toBe(false);
    expect(state.rings).toHaveLength(0);
  });

  it('never throws behind the thrower', () => {
    const state = createState();
    throwRing(state, 400, THROWER.y + 100);
    expect(state.rings[0].toY).toBeLessThan(THROWER.y);
  });

  it('pushes the throw sideways by the sway', () => {
    const state = createState();
    state.time = 0.5;
    throwRing(state, 400, 100);
    expect(state.rings[0].toX).toBeCloseTo(400 + swayOffset(0.5));
  });

  it('scores a ring that lands on a bottle neck', () => {
    const state = createState();
    const bottle = state.bottles[0];
    throwRing(state, bottle.x, bottle.y);
    step(state, FLIGHT_TIME);
    expect(state.score).toBe(bottle.points);
    expect(bottle.rings).toBe(1);
  });

  it('scores nothing for a ring that misses every neck', () => {
    const state = createState();
    throwRing(state, 5, 300);
    step(state, FLIGHT_TIME);
    expect(state.score).toBe(0);
    expect(state.rings).toHaveLength(0);
  });

  it('only scores once the ring lands', () => {
    const state = createState();
    const bottle = state.bottles[0];
    throwRing(state, bottle.x, bottle.y);
    step(state, FLIGHT_TIME / 2);
    expect(state.score).toBe(0);
    expect(state.rings).toHaveLength(1);
  });

  it('scores bottles further back higher', () => {
    const state = createState();
    const back = state.bottles.reduce((a, b) => (b.y < a.y ? b : a));
    const front = state.bottles.reduce((a, b) => (b.y > a.y ? b : a));
    expect(back.points).toBeGreaterThan(front.points);
  });

  it('finds a neck within reach and misses one out of reach', () => {
    const { bottles } = createState();
    const bottle = bottles[0];
    expect(bottleAt(bottles, bottle.x + NECK_RADIUS - 1, bottle.y)).toBe(bottle);
    expect(bottleAt(bottles, bottle.x + NECK_RADIUS + 1, bottle.y + 30)).toBeUndefined();
  });

  it('ends the round when the rings run out and the last one has landed', () => {
    const state = createState();
    state.ringsLeft = 1;
    throwRing(state, 400, 100);
    step(state, FLIGHT_TIME / 2);
    expect(state.phase).toBe('playing');
    step(state, FLIGHT_TIME);
    expect(state.phase).toBe('over');
  });

  it('cannot throw once the round is over', () => {
    const state = createState();
    state.phase = 'over';
    expect(throwRing(state, 400, 100)).toBe(false);
  });
});
