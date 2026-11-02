import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';
import { getActiveSkin } from '../../midway/skins';
import { HALLOWEEN_DARTS } from './skins/halloween';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const DARTS_PER_ROUND = 5;
/** Seconds a dart spends in the air. */
export const FLIGHT_TIME = 0.35;
/** The aim drifts around the cursor by up to this many pixels each way. */
export const SWAY = 30;
const SWAY_SPEED_X = 1.7;
const SWAY_SPEED_Y = 2.3;
/** Where the dartboard hangs, at the back of the booth. */
export const BOARD = { x: WIDTH / 2, y: 210 } as const;
/** From the bullseye out: a dart scores the first ring whose radius it lands inside. */
export const RINGS = [
  { radius: 10, points: 50 },
  { radius: 24, points: 25 },
  { radius: 60, points: 15 },
  { radius: 100, points: 10 },
  { radius: 140, points: 5 },
] as const;
export const BOARD_RADIUS = RINGS[RINGS.length - 1].radius;
export const THROWER = { x: WIDTH / 2, y: HEIGHT - 20 } as const;

type ThemeColor = keyof typeof theme.colors;

/** How the booth looks under a midway skin. Anything left out is drawn the classic way. */
export interface DartsSkin {
  /** An SVG URL drawn over the whole booth, behind the board. */
  backdrop?: string;
  /** An SVG URL of one dart, tip at the top. */
  dart?: string;
  /** Theme colours for the board. */
  board?: {
    rings: [ThemeColor, ThemeColor];
    wire: ThemeColor;
    bull: ThemeColor;
    outerBull: ThemeColor;
  };
}

const CLASSIC_DARTS: DartsSkin = {
  board: { rings: ['stripeA', 'stripeB'], wire: 'wood', bull: 'danger', outerBull: 'water' },
};

/** The booth's look for each midway skin id. */
const SKINS: Record<string, DartsSkin> = { halloween: HALLOWEEN_DARTS };

/** The booth's look under the midway skin with this id, falling back to classic. */
export function dartsSkin(skinId: string): DartsSkin {
  return { ...CLASSIC_DARTS, ...SKINS[skinId] };
}

export interface Dart {
  toX: number;
  toY: number;
  /** Seconds since the throw. */
  age: number;
}

export interface Hit {
  x: number;
  y: number;
  points: number;
  /** Seconds since the dart hit; drives the score popup. */
  age: number;
}

export interface DartsState {
  /** Darts in the air. */
  darts: Dart[];
  /** Darts that have landed, stuck in the board or the wall. */
  hits: Hit[];
  dartsLeft: number;
  score: number;
  /** Seconds since the round started; drives the sway. */
  time: number;
  phase: 'playing' | 'over';
}

export function createState(): DartsState {
  return { darts: [], hits: [], dartsLeft: DARTS_PER_ROUND, score: 0, time: 0, phase: 'playing' };
}

/** How far the aim has drifted from the cursor at this time. */
export function swayOffset(time: number): { x: number; y: number } {
  return {
    x: Math.sin(time * SWAY_SPEED_X) * SWAY,
    y: Math.cos(time * SWAY_SPEED_Y) * SWAY,
  };
}

/** The points for a dart that lands at (x, y). Zero off the board. */
export function pointsAt(x: number, y: number): number {
  const distance = Math.hypot(x - BOARD.x, y - BOARD.y);
  return RINGS.find((ring) => distance <= ring.radius)?.points ?? 0;
}

/** Throws one dart at the aim point, pushed off by the sway. Returns false if nothing was thrown. */
export function throwDart(state: DartsState, aimX: number, aimY: number): boolean {
  if (state.phase !== 'playing' || state.dartsLeft === 0) return false;
  const sway = swayOffset(state.time);
  state.darts.push({
    toX: aimX + sway.x,
    toY: Math.min(aimY + sway.y, THROWER.y - 1),
    age: 0,
  });
  state.dartsLeft -= 1;
  return true;
}

/** Where a dart in flight is now, and how big to draw it: it shrinks as it flies away. */
export function dartPosition(dart: Dart): { x: number; y: number; scale: number } {
  const t = Math.min(dart.age / FLIGHT_TIME, 1);
  return {
    x: THROWER.x + (dart.toX - THROWER.x) * t,
    y: THROWER.y + (dart.toY - THROWER.y) * t - Math.sin(t * Math.PI) * 40,
    scale: 1 - t * 0.6,
  };
}

/** Advances the game by `dt` seconds. */
export function step(state: DartsState, dt: number): void {
  state.time += dt;
  for (const hit of state.hits) hit.age += dt;

  const flying: Dart[] = [];
  for (const dart of state.darts) {
    dart.age += dt;
    if (dart.age < FLIGHT_TIME) {
      flying.push(dart);
      continue;
    }
    const points = pointsAt(dart.toX, dart.toY);
    state.score += points;
    // Count only the part of this step after the dart landed.
    state.hits.push({ x: dart.toX, y: dart.toY, points, age: dart.age - FLIGHT_TIME });
  }
  state.darts = flying;

  if (state.dartsLeft === 0 && state.darts.length === 0) state.phase = 'over';
}

const images = new Map<string, HTMLImageElement>();

/** The picture at `url`, once it has loaded. */
function image(url: string | undefined): HTMLImageElement | undefined {
  if (!url) return undefined;
  let img = images.get(url);
  if (!img) {
    img = new Image();
    img.src = url;
    images.set(url, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : undefined;
}

/** Draws a dart with its tip at (x, y). */
function drawDart(
  ctx: CanvasRenderingContext2D,
  skin: DartsSkin,
  x: number,
  y: number,
  scale: number,
) {
  const height = 64 * scale;
  const sprite = image(skin.dart);
  if (sprite) {
    const width = (sprite.naturalWidth / sprite.naturalHeight) * height;
    ctx.drawImage(sprite, x - width / 2, y, width, height);
    return;
  }
  const { colors } = theme;
  ctx.fillStyle = colors.muted;
  ctx.fillRect(x - 1, y, 2, height * 0.2);
  ctx.fillStyle = colors.text;
  ctx.fillRect(x - 2.5 * scale, y + height * 0.2, 5 * scale, height * 0.55);
  ctx.fillStyle = colors.danger;
  ctx.beginPath();
  ctx.moveTo(x, y + height * 0.65);
  ctx.lineTo(x - 9 * scale, y + height);
  ctx.lineTo(x + 9 * scale, y + height);
  ctx.closePath();
  ctx.fill();
}

function drawBoard(ctx: CanvasRenderingContext2D, skin: DartsSkin) {
  const { colors } = theme;
  const board = skin.board ?? CLASSIC_DARTS.board!;

  // The board's dark rim.
  ctx.fillStyle = colors.surface;
  ctx.beginPath();
  ctx.arc(BOARD.x, BOARD.y, BOARD_RADIUS + 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = colors[board.wire];
  ctx.lineWidth = 2;
  for (let i = RINGS.length - 1; i >= 0; i--) {
    const ring = RINGS[i];
    ctx.fillStyle =
      i === 0 ? colors[board.bull] : i === 1 ? colors[board.outerBull] : colors[board.rings[i % 2]];
    ctx.beginPath();
    ctx.arc(BOARD.x, BOARD.y, ring.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Ring values down the right-hand side.
  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('small', 'bold');
  ctx.textAlign = 'left';
  for (let i = 2; i < RINGS.length; i++) {
    const inner = RINGS[i - 1].radius;
    ctx.fillText(`${RINGS[i].points}`, BOARD.x + (inner + RINGS[i].radius) / 2 - 8, BOARD.y + 5);
  }
}

function draw(ctx: CanvasRenderingContext2D, state: DartsState, aim: { x: number; y: number }) {
  const { colors } = theme;
  const skin = dartsSkin(getActiveSkin().id);

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const backdrop = image(skin.backdrop);
  if (backdrop) {
    ctx.drawImage(backdrop, 0, 0, WIDTH, HEIGHT);
  } else {
    // The booth's awning and back wall.
    ctx.fillStyle = colors.wood;
    ctx.fillRect(0, 40, WIDTH, HEIGHT - 120);
    const stripe = WIDTH / 16;
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
      ctx.fillRect(i * stripe, 0, stripe, 40);
    }
  }

  drawBoard(ctx, skin);

  for (const hit of state.hits) drawDart(ctx, skin, hit.x, hit.y, 0.4);
  for (const dart of state.darts) {
    const { x, y, scale } = dartPosition(dart);
    drawDart(ctx, skin, x, y, scale);
  }

  // How much the last darts scored, rising and fading.
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'center';
  for (const hit of state.hits) {
    if (hit.age >= 0.8) continue;
    ctx.globalAlpha = 1 - hit.age / 0.8;
    ctx.fillStyle = hit.points > 0 ? colors.accent : colors.danger;
    ctx.fillText(hit.points > 0 ? `+${hit.points}` : 'Miss', hit.x, hit.y - 16 - hit.age * 40);
  }
  ctx.globalAlpha = 1;

  // Where a dart thrown now would land.
  if (state.phase === 'playing' && state.dartsLeft > 0) {
    const sway = swayOffset(state.time);
    const x = aim.x + sway.x;
    const y = Math.min(aim.y + sway.y, THROWER.y - 1);
    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.moveTo(x - 12, y);
    ctx.lineTo(x + 12, y);
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x, y + 12);
    ctx.stroke();
  }

  // Darts waiting to be thrown.
  for (let i = 0; i < state.dartsLeft; i++) {
    drawDart(ctx, skin, THROWER.x - ((DARTS_PER_ROUND - 1) * 20) / 2 + i * 20, HEIGHT - 64, 0.7);
  }

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, HEIGHT - 20);
  ctx.textAlign = 'right';
  ctx.fillText(`Darts ${state.dartsLeft}/${DARTS_PER_ROUND}`, WIDTH - 16, HEIGHT - 20);

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Out of darts! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 40);
  }
}

export const darts: CarnivalGame = {
  id: 'darts',
  name: 'Darts',
  description: 'Throw five darts at the board. The closer to the bullseye, the more you score.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;
    const aim = { x: BOARD.x, y: BOARD.y };

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
        throwDart(state, aim.x, aim.y);
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
        recordScore(darts.id, state.score);
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

export default darts;
