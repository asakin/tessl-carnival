import { describe, expect, it } from 'vitest';
import {
  BOARD,
  BOARD_RADIUS,
  DARTS_PER_ROUND,
  FLIGHT_TIME,
  RINGS,
  THROWER,
  createState,
  dartsSkin,
  pointsAt,
  step,
  swayOffset,
  throwDart,
} from './game';

/** Throws a dart that lands exactly on (x, y), sway included. */
function throwAt(state: ReturnType<typeof createState>, x: number, y: number) {
  const sway = swayOffset(state.time);
  throwDart(state, x - sway.x, y - sway.y);
}

describe('darts', () => {
  it('starts with a full set of darts and no score', () => {
    const state = createState();
    expect(state.dartsLeft).toBe(DARTS_PER_ROUND);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
  });

  it('uses one dart per throw', () => {
    const state = createState();
    expect(throwDart(state, BOARD.x, BOARD.y)).toBe(true);
    expect(state.dartsLeft).toBe(DARTS_PER_ROUND - 1);
    expect(state.darts).toHaveLength(1);
  });

  it('cannot throw once the darts run out', () => {
    const state = createState();
    state.dartsLeft = 0;
    expect(throwDart(state, BOARD.x, BOARD.y)).toBe(false);
    expect(state.darts).toHaveLength(0);
  });

  it('pushes the throw off by the sway', () => {
    const state = createState();
    state.time = 0.5;
    throwDart(state, 400, 200);
    const sway = swayOffset(0.5);
    expect(state.darts[0].toX).toBeCloseTo(400 + sway.x);
    expect(state.darts[0].toY).toBeCloseTo(200 + sway.y);
  });

  it('never throws behind the thrower', () => {
    const state = createState();
    throwDart(state, 400, THROWER.y + 100);
    expect(state.darts[0].toY).toBeLessThan(THROWER.y);
  });

  it('scores the bullseye most', () => {
    const bull = pointsAt(BOARD.x, BOARD.y);
    expect(bull).toBe(50);
    for (const ring of RINGS.slice(1)) expect(ring.points).toBeLessThan(bull);
  });

  it('scores each ring by where the dart lands', () => {
    let inner = 0;
    for (const ring of RINGS) {
      const middle = (inner + ring.radius) / 2;
      expect(pointsAt(BOARD.x + middle, BOARD.y)).toBe(ring.points);
      expect(pointsAt(BOARD.x, BOARD.y - ring.radius)).toBe(ring.points);
      inner = ring.radius;
    }
  });

  it('scores rings further out lower', () => {
    for (let i = 1; i < RINGS.length; i++) {
      expect(RINGS[i].points).toBeLessThan(RINGS[i - 1].points);
    }
  });

  it('scores nothing off the board', () => {
    expect(pointsAt(BOARD.x + BOARD_RADIUS + 1, BOARD.y)).toBe(0);
  });

  it('only scores once the dart lands', () => {
    const state = createState();
    throwAt(state, BOARD.x, BOARD.y);
    step(state, FLIGHT_TIME / 2);
    expect(state.score).toBe(0);
    expect(state.darts).toHaveLength(1);
    step(state, FLIGHT_TIME / 2);
    expect(state.score).toBe(50);
    expect(state.darts).toHaveLength(0);
    expect(state.hits).toEqual([{ x: BOARD.x, y: BOARD.y, points: 50, age: 0 }]);
  });

  it('adds up every dart in the round', () => {
    const state = createState();
    throwAt(state, BOARD.x, BOARD.y);
    step(state, FLIGHT_TIME);
    throwAt(state, BOARD.x + 50, BOARD.y);
    step(state, FLIGHT_TIME);
    throwAt(state, 5, 5);
    step(state, FLIGHT_TIME);
    expect(state.score).toBe(50 + 15);
    expect(state.hits.map((h) => h.points)).toEqual([50, 15, 0]);
  });

  it('ends the round when the darts run out and the last one has landed', () => {
    const state = createState();
    state.dartsLeft = 1;
    throwDart(state, BOARD.x, BOARD.y);
    step(state, FLIGHT_TIME / 2);
    expect(state.phase).toBe('playing');
    step(state, FLIGHT_TIME);
    expect(state.phase).toBe('over');
  });

  it('cannot throw once the round is over', () => {
    const state = createState();
    state.phase = 'over';
    expect(throwDart(state, BOARD.x, BOARD.y)).toBe(false);
  });

  it('draws the classic booth for the classic skin and any skin it does not know', () => {
    for (const id of ['classic', 'no-such-skin']) {
      const skin = dartsSkin(id);
      expect(skin.backdrop).toBeUndefined();
      expect(skin.dart).toBeUndefined();
      expect(skin.board).toBeDefined();
    }
  });

  it('ships a Halloween look with its own backdrop, dart and board colours', () => {
    const skin = dartsSkin('halloween');
    expect(skin.backdrop).toBeTruthy();
    expect(skin.dart).toBeTruthy();
    expect(skin.board).not.toEqual(dartsSkin('classic').board);
  });
});
