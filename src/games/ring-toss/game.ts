import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const RINGS_PER_ROUND = 8;
/** Seconds a ring spends in the air. */
export const FLIGHT_TIME = 0.6;
/** How far from a bottle's neck a ring can land and still score. */
export const NECK_RADIUS = 14;
/** The aim sways side to side by up to this many pixels. */
export const SWAY = 40;
const SWAY_SPEED = 2.2;
export const THROWER = { x: WIDTH / 2, y: HEIGHT - 30 } as const;
/** Back row first. Bottles further back score more. */
const ROWS = [
  { y: 110, points: 30 },
  { y: 175, points: 20 },
  { y: 240, points: 10 },
];
const BOTTLES_PER_ROW = 5;
const BOTTLE_SPACING = 90;

export interface Bottle {
  x: number;
  /** Where the neck is: a ring has to land here to score. */
  y: number;
  points: number;
  rings: number;
}

export interface Ring {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  /** Seconds since the throw. */
  age: number;
}

export interface Landing {
  x: number;
  y: number;
  scored: boolean;
  age: number;
}

export interface RingTossState {
  bottles: Bottle[];
  rings: Ring[];
  landings: Landing[];
  ringsLeft: number;
  score: number;
  /** Seconds since the round started; drives the sway. */
  time: number;
  phase: 'playing' | 'over';
}

export function createState(): RingTossState {
  const left = WIDTH / 2 - ((BOTTLES_PER_ROW - 1) * BOTTLE_SPACING) / 2;
  const bottles = ROWS.flatMap((row) =>
    Array.from({ length: BOTTLES_PER_ROW }, (_, i) => ({
      x: left + i * BOTTLE_SPACING,
      y: row.y,
      points: row.points,
      rings: 0,
    })),
  );
  return {
    bottles,
    rings: [],
    landings: [],
    ringsLeft: RINGS_PER_ROUND,
    score: 0,
    time: 0,
    phase: 'playing',
  };
}

/** The current sideways drift of the aim, in pixels. */
export function swayOffset(time: number): number {
  return Math.sin(time * SWAY_SPEED) * SWAY;
}

/** The bottle whose neck a ring landing at (x, y) goes over, if any. */
export function bottleAt(bottles: readonly Bottle[], x: number, y: number): Bottle | undefined {
  let closest: Bottle | undefined;
  let closestDistance = NECK_RADIUS;
  for (const bottle of bottles) {
    const distance = Math.hypot(x - bottle.x, y - bottle.y);
    if (distance <= closestDistance) {
      closest = bottle;
      closestDistance = distance;
    }
  }
  return closest;
}

/** Throws one ring at the aim point, pushed sideways by the sway. Returns false if nothing was thrown. */
export function throwRing(state: RingTossState, aimX: number, aimY: number): boolean {
  if (state.phase !== 'playing' || state.ringsLeft === 0) return false;
  state.rings.push({
    fromX: THROWER.x,
    fromY: THROWER.y,
    toX: aimX + swayOffset(state.time),
    toY: Math.min(aimY, THROWER.y - 1),
    age: 0,
  });
  state.ringsLeft -= 1;
  return true;
}

/** Where a ring in flight is now. */
export function ringPosition(ring: Ring): { x: number; y: number } {
  const t = Math.min(ring.age / FLIGHT_TIME, 1);
  return {
    x: ring.fromX + (ring.toX - ring.fromX) * t,
    // A little arc so the throw reads as a toss.
    y: ring.fromY + (ring.toY - ring.fromY) * t - Math.sin(t * Math.PI) * 60,
  };
}

/** Advances the game by `dt` seconds. */
export function step(state: RingTossState, dt: number): void {
  state.time += dt;

  const flying: Ring[] = [];
  for (const ring of state.rings) {
    ring.age += dt;
    if (ring.age < FLIGHT_TIME) {
      flying.push(ring);
      continue;
    }
    const bottle = bottleAt(state.bottles, ring.toX, ring.toY);
    if (bottle) {
      bottle.rings += 1;
      state.score += bottle.points;
    }
    state.landings.push({ x: ring.toX, y: ring.toY, scored: Boolean(bottle), age: 0 });
  }
  state.rings = flying;

  for (const landing of state.landings) landing.age += dt;
  state.landings = state.landings.filter((l) => l.age < 0.5);

  if (state.ringsLeft === 0 && state.rings.length === 0) state.phase = 'over';
}

function drawRing(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * 0.45, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function draw(ctx: CanvasRenderingContext2D, state: RingTossState, aim: { x: number; y: number }) {
  const { colors } = theme;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Booth awning.
  const stripe = WIDTH / 16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
    ctx.fillRect(i * stripe, 0, stripe, 40);
  }

  // Shelves under each row of bottles.
  for (const row of ROWS) {
    ctx.fillStyle = colors.wood;
    ctx.fillRect(60, row.y + 34, WIDTH - 120, 8);
    ctx.fillStyle = colors.muted;
    ctx.font = canvasFont('small', 'bold');
    ctx.textAlign = 'left';
    ctx.fillText(`${row.points}`, 24, row.y + 30);
  }

  for (const bottle of state.bottles) {
    ctx.fillStyle = colors.water;
    ctx.fillRect(bottle.x - 12, bottle.y + 8, 24, 26);
    ctx.fillRect(bottle.x - 4, bottle.y - 6, 8, 16);
    ctx.fillStyle = colors.surface;
    ctx.fillRect(bottle.x - 5, bottle.y - 9, 10, 4);
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 3;
    for (let i = 0; i < bottle.rings; i++) drawRing(ctx, bottle.x, bottle.y + 6 + i * 4, 12);
  }

  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 4;
  for (const ring of state.rings) {
    const { x, y } = ringPosition(ring);
    drawRing(ctx, x, y, 18 - (ring.age / FLIGHT_TIME) * 6);
  }

  ctx.lineWidth = 3;
  for (const landing of state.landings) {
    ctx.globalAlpha = 1 - landing.age / 0.5;
    ctx.strokeStyle = landing.scored ? colors.accent : colors.danger;
    drawRing(ctx, landing.x, landing.y, 12 + landing.age * 30);
  }
  ctx.globalAlpha = 1;

  // Where a ring thrown now would land.
  if (state.phase === 'playing' && state.ringsLeft > 0) {
    const x = aim.x + swayOffset(state.time);
    const y = Math.min(aim.y, THROWER.y - 1);
    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 8, y);
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x, y + 8);
    ctx.stroke();
  }

  // Rings waiting to be thrown.
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 3;
  for (let i = 0; i < state.ringsLeft; i++) {
    drawRing(ctx, THROWER.x - ((RINGS_PER_ROUND - 1) * 14) / 2 + i * 14, THROWER.y, 10);
  }

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, HEIGHT - 20);
  ctx.textAlign = 'right';
  ctx.fillText(`Rings ${state.ringsLeft}/${RINGS_PER_ROUND}`, WIDTH - 16, HEIGHT - 20);

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Out of rings! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 40);
  }
}

export const ringToss: CarnivalGame = {
  id: 'ring-toss',
  name: 'Ring Toss',
  description:
    'Land rings on the bottle necks before you run out. Bottles further back score more.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;
    const aim = { x: WIDTH / 2, y: ROWS[1].y };

    const toCanvas = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
      };
    };
    const onMove = (event: PointerEvent) => Object.assign(aim, toCanvas(event));
    const onDown = (event: PointerEvent) => {
      Object.assign(aim, toCanvas(event));
      if (state.phase === 'over') {
        state = createState();
        scoreRecorded = false;
      } else {
        throwRing(state, aim.x, aim.y);
      }
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't teleport everything.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      step(state, dt);
      if (state.phase === 'over' && !scoreRecorded) {
        recordScore(ringToss.id, state.score);
        scoreRecorded = true;
      }
      draw(ctx, state, aim);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
    };
  },
};

export default ringToss;
