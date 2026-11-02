import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';
import { getActiveSkin, onSkinChange } from '../../midway/skins';
import { lookFor, type DuckLook } from './skins';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const CASTS_PER_ROUND = 6;
/** The hook hangs straight down from the rod tip, here. */
export const HOOK_X = WIDTH / 2;
/** Where the hook rests between casts. */
export const HOOK_TOP = 70;
/** The water line the ducks float on. */
export const WATER_Y = 330;
/** How fast the hook speeds up while you lower it, in px/s². */
export const HOOK_ACCEL = 400;
/** The fastest the hook can be moving and still catch a duck, in px/s. */
export const GENTLE_SPEED = 140;
const REEL_SPEED = 360;

export const DUCK_SPEED = 90;
export const DUCK_SPACING = 100;
/** Half the width of a duck's body. */
export const BODY_HALF = 30;
/** How far ahead of a duck's centre the ring on its head sits. */
export const RING_OFFSET = 12;
/** The hook has to be this close to the ring, side to side. */
export const RING_HALF = 10;
/** The hook tip has to stop in this band, the ring's height, to catch it. */
export const RING_TOP = WATER_Y - 62;
export const RING_BOTTOM = WATER_Y - 50;
/** Seconds a knocked duck spends bobbing back up. */
export const SINK_TIME = 0.8;
const SINK_DEPTH = 10;
/** The numbers on the ducks' bases, in the order they float. */
const NUMBERS = [10, 20, 10, 50, 10, 20, 30, 10, 20];
/** Ducks float right and come back round on the left. */
const LOOP = NUMBERS.length * DUCK_SPACING;

export interface Duck {
  x: number;
  /** The number on its base: what it scores. */
  points: number;
  /** Seconds left sinking after a clumsy hook; it can't be caught meanwhile. */
  sink: number;
}

export interface Hook {
  /** The hook tip's height. */
  y: number;
  /** Pixels per second, downwards. */
  speed: number;
  /** True while the player is lowering it. */
  lowering: boolean;
  /** Casting: the player is lowering it. Reeling: the cast is over and it's coming back up. */
  phase: 'casting' | 'reeling';
  /** Points on the duck it caught this cast, while it reels the duck in. */
  carrying?: number;
}

export interface Callout {
  text: string;
  x: number;
  y: number;
  good: boolean;
  age: number;
}

export interface HookADuckState {
  ducks: Duck[];
  hook: Hook;
  callouts: Callout[];
  castsLeft: number;
  score: number;
  phase: 'playing' | 'over';
}

export type CastResult = 'caught' | 'too-fast' | 'landed-on-duck' | 'splash';

export function createState(): HookADuckState {
  const ducks = NUMBERS.map((points, i) => ({
    x: i * DUCK_SPACING,
    points,
    sink: 0,
  }));
  return {
    ducks,
    hook: { y: HOOK_TOP, speed: 0, lowering: false, phase: 'casting' },
    callouts: [],
    castsLeft: CASTS_PER_ROUND,
    score: 0,
    phase: 'playing',
  };
}

export function ringX(duck: Duck): number {
  return duck.x + RING_OFFSET;
}

/** Starts lowering the hook. Returns false if the hook can't be lowered now. */
export function lower(state: HookADuckState): boolean {
  if (state.phase !== 'playing' || state.hook.phase !== 'casting') return false;
  state.hook.lowering = true;
  return true;
}

/** Stops lowering the hook, so it hangs where it is. */
export function hold(state: HookADuckState): void {
  state.hook.lowering = false;
  state.hook.speed = 0;
}

/**
 * What happens to the hook right now, or undefined if the cast goes on. Only a
 * hook being lowered in a cast can end it: a hanging hook catches nothing. The
 * hook catches a duck when its tip is in the ring's band, over the ring, and
 * moving gently. Too fast, or below the ring onto the duck, and it misses.
 */
export function castResult(state: HookADuckState): { result: CastResult; duck?: Duck } | undefined {
  const { hook } = state;
  if (state.phase !== 'playing' || hook.phase !== 'casting' || !hook.lowering) return undefined;
  for (const duck of state.ducks) {
    if (duck.sink > 0 || Math.abs(HOOK_X - duck.x) > BODY_HALF) continue;
    const onRing = Math.abs(HOOK_X - ringX(duck)) <= RING_HALF;
    if (onRing && hook.y >= RING_TOP && hook.y <= RING_BOTTOM) {
      return { result: hook.speed <= GENTLE_SPEED ? 'caught' : 'too-fast', duck };
    }
    if (hook.y > RING_BOTTOM) return { result: onRing ? 'too-fast' : 'landed-on-duck', duck };
  }
  if (hook.y >= WATER_Y) return { result: 'splash' };
  return undefined;
}

const CALLOUTS: Record<CastResult, string> = {
  caught: '',
  'too-fast': 'Too fast!',
  'landed-on-duck': 'Right on top!',
  splash: 'Splash!',
};

function endCast(state: HookADuckState, result: CastResult, duck?: Duck) {
  const { hook } = state;
  if (result === 'caught' && duck) {
    state.score += duck.points;
    hook.carrying = duck.points;
    // The caught duck goes back in at the start of the stream.
    duck.x -= LOOP;
  } else if (duck) {
    duck.sink = SINK_TIME;
  }
  state.callouts.push({
    text: result === 'caught' && duck ? `+${duck.points}` : CALLOUTS[result],
    x: HOOK_X,
    y: Math.min(hook.y, WATER_Y) - 30,
    good: result === 'caught',
    age: 0,
  });
  state.castsLeft -= 1;
  hook.phase = 'reeling';
  hook.lowering = false;
  hook.speed = 0;
}

/** Advances the game by `dt` seconds. */
export function step(state: HookADuckState, dt: number): void {
  for (const duck of state.ducks) {
    duck.x += DUCK_SPEED * dt;
    if (duck.x >= LOOP - DUCK_SPACING / 2) duck.x -= LOOP;
    duck.sink = Math.max(0, duck.sink - dt);
  }

  const { hook } = state;
  if (state.phase === 'playing' && hook.phase === 'casting') {
    // A hanging hook catches nothing: it has to be lowered onto the ring.
    if (hook.lowering) {
      hook.speed += HOOK_ACCEL * dt;
      hook.y += hook.speed * dt;
      const outcome = castResult(state);
      if (outcome) endCast(state, outcome.result, outcome.duck);
    }
  } else if (hook.phase === 'reeling') {
    hook.y = Math.max(HOOK_TOP, hook.y - REEL_SPEED * dt);
    if (hook.y === HOOK_TOP) {
      hook.phase = 'casting';
      hook.carrying = undefined;
      if (state.castsLeft === 0) state.phase = 'over';
    }
  }

  for (const callout of state.callouts) callout.age += dt;
  state.callouts = state.callouts.filter((c) => c.age < 1);
}

function loadImage(url: string | undefined): HTMLImageElement | undefined {
  if (!url) return undefined;
  const image = new Image();
  image.src = url;
  return image;
}

function ready(image: HTMLImageElement | undefined): image is HTMLImageElement {
  return !!image && image.complete && image.naturalWidth > 0;
}

interface Pictures {
  backdrop?: HTMLImageElement;
  duck?: HTMLImageElement;
  look: DuckLook;
}

function loadPictures(look: DuckLook): Pictures {
  return { backdrop: loadImage(look.backdrop), duck: loadImage(look.duck), look };
}

function drawBackdrop(ctx: CanvasRenderingContext2D, pictures: Pictures) {
  const { colors } = theme;
  if (ready(pictures.backdrop)) {
    // Cover the booth, cropping the picture's sides.
    const image = pictures.backdrop;
    const fit = Math.max(WIDTH / image.naturalWidth, HEIGHT / image.naturalHeight);
    const w = image.naturalWidth * fit;
    const h = image.naturalHeight * fit;
    ctx.drawImage(image, (WIDTH - w) / 2, (HEIGHT - h) / 2, w, h);
    return;
  }
  if (pictures.look.harvest) {
    drawHarvestBackdrop(ctx, pictures.look.sign);
    return;
  }
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const stripe = WIDTH / 16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
    ctx.fillRect(i * stripe, 0, stripe, 40);
  }
}

/** A warm harvest booth: a wood and gold awning, falling leaves and a sign. */
function drawHarvestBackdrop(ctx: CanvasRenderingContext2D, sign: string | undefined) {
  const { colors } = theme;
  ctx.fillStyle = colors.surface;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const stripe = WIDTH / 16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? colors.wood : colors.accent;
    ctx.fillRect(i * stripe, 0, stripe, 40);
    // A scalloped edge under the awning.
    ctx.beginPath();
    ctx.arc(i * stripe + stripe / 2, 40, stripe / 2, 0, Math.PI);
    ctx.fill();
  }
  const leaves = [colors.stripeA, colors.accent, colors.wood, colors.danger];
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = leaves[i % leaves.length];
    ctx.beginPath();
    ctx.ellipse(40 + i * 56, 110 + ((i * 47) % 150), 9, 5, i, 0, Math.PI * 2);
    ctx.fill();
  }
  if (sign) {
    ctx.fillStyle = colors.wood;
    ctx.fillRect(WIDTH / 2 - 150, 70, 300, 50);
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(WIDTH / 2 - 150, 70, 300, 50);
    ctx.fillStyle = colors.stripeB;
    ctx.font = canvasFont('title', 'bold');
    ctx.textAlign = 'center';
    ctx.fillText(sign, WIDTH / 2, 107);
  }
}

/** A turkey facing right, its head under the ring where a duck's would be. */
function drawTurkey(ctx: CanvasRenderingContext2D, x: number, waterline: number) {
  const { colors } = theme;
  // Fanned tail feathers behind the body.
  const feathers = [colors.stripeA, colors.accent, colors.wood, colors.danger, colors.stripeB];
  for (let i = 0; i < 7; i++) {
    const angle = Math.PI * (0.55 + (i / 6) * 0.9);
    ctx.fillStyle = feathers[i % feathers.length];
    ctx.beginPath();
    ctx.ellipse(
      x - 10 + Math.cos(angle) * 22,
      waterline - 22 - Math.sin(angle) * 22,
      9,
      22,
      angle - Math.PI / 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  // A plump body and a wing.
  ctx.fillStyle = colors.wood;
  ctx.beginPath();
  ctx.ellipse(x, waterline - 12, BODY_HALF, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.stripeA;
  ctx.beginPath();
  ctx.ellipse(x - 4, waterline - 14, 14, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // The neck and head.
  ctx.fillStyle = colors.stripeB;
  ctx.beginPath();
  ctx.ellipse(x + RING_OFFSET - 2, waterline - 26, 6, 10, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + RING_OFFSET, waterline - 36, 10, 0, Math.PI * 2);
  ctx.fill();
  // The beak, the wattle hanging beside it and the eye.
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.moveTo(x + RING_OFFSET + 8, waterline - 40);
  ctx.lineTo(x + RING_OFFSET + 18, waterline - 36);
  ctx.lineTo(x + RING_OFFSET + 8, waterline - 33);
  ctx.fill();
  ctx.fillStyle = colors.danger;
  ctx.beginPath();
  ctx.ellipse(x + RING_OFFSET + 9, waterline - 28, 3, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.background;
  ctx.beginPath();
  ctx.arc(x + RING_OFFSET + 3, waterline - 39, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawDuck(ctx: CanvasRenderingContext2D, x: number, waterline: number, pictures: Pictures) {
  const { colors } = theme;
  if (pictures.look.creature === 'turkey') {
    drawTurkey(ctx, x, waterline);
  } else if (ready(pictures.duck)) {
    const w = BODY_HALF * 2.4;
    const h = (pictures.duck.naturalHeight / pictures.duck.naturalWidth) * w;
    ctx.drawImage(pictures.duck, x - w / 2, waterline + 8 - h, w, h);
  } else {
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.ellipse(x, waterline - 12, BODY_HALF, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + RING_OFFSET, waterline - 36, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.stripeA;
    ctx.beginPath();
    ctx.moveTo(x + RING_OFFSET + 10, waterline - 40);
    ctx.lineTo(x + RING_OFFSET + 24, waterline - 34);
    ctx.lineTo(x + RING_OFFSET + 10, waterline - 30);
    ctx.fill();
    ctx.fillStyle = colors.background;
    ctx.beginPath();
    ctx.arc(x + RING_OFFSET + 4, waterline - 39, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // The ring on its head that the hook has to catch.
  ctx.strokeStyle = colors.muted;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x + RING_OFFSET, waterline - 56, RING_HALF - 2, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function draw(ctx: CanvasRenderingContext2D, state: HookADuckState, pictures: Pictures) {
  const { colors } = theme;
  const night = ready(pictures.backdrop);

  drawBackdrop(ctx, pictures);

  // The stream, behind the ducks and in front of them.
  const streamBottom = HEIGHT - 60;
  ctx.fillStyle = colors.water;
  ctx.fillRect(0, WATER_Y - 10, WIDTH, streamBottom - WATER_Y + 10);
  if (night) {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(0, WATER_Y - 10, WIDTH, streamBottom - WATER_Y + 10);
    ctx.globalAlpha = 1;
  }

  for (const duck of state.ducks) {
    const sunk = (duck.sink / SINK_TIME) * SINK_DEPTH;
    drawDuck(ctx, duck.x, WATER_Y + sunk, pictures);
  }

  ctx.fillStyle = colors.water;
  ctx.globalAlpha = night ? 0.35 : 0.6;
  ctx.fillRect(0, WATER_Y, WIDTH, streamBottom - WATER_Y);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.wood;
  ctx.fillRect(0, streamBottom, WIDTH, HEIGHT - streamBottom);

  // The rod, the line and the hook.
  const { hook } = state;
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(WIDTH - 40, 20);
  ctx.lineTo(HOOK_X, HOOK_TOP - 30);
  ctx.stroke();
  ctx.lineCap = 'butt';
  const tooFast = hook.speed > GENTLE_SPEED;
  ctx.strokeStyle = tooFast ? colors.danger : colors.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(HOOK_X, HOOK_TOP - 30);
  ctx.lineTo(HOOK_X, hook.y - 10);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(HOOK_X, hook.y - 10);
  ctx.lineTo(HOOK_X, hook.y);
  ctx.arc(HOOK_X - 6, hook.y, 6, 0, Math.PI * 0.9);
  ctx.stroke();
  if (hook.carrying !== undefined) {
    // Out of the water, the number on the duck's base shows.
    drawDuck(ctx, HOOK_X - RING_OFFSET, hook.y + 56, pictures);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body', 'bold');
    ctx.textAlign = 'center';
    ctx.fillText(String(hook.carrying), HOOK_X - RING_OFFSET, hook.y + 84);
  }

  ctx.textAlign = 'center';
  ctx.font = canvasFont('title', 'bold');
  for (const callout of state.callouts) {
    ctx.globalAlpha = 1 - callout.age;
    ctx.fillStyle = callout.good ? colors.accent : colors.danger;
    ctx.fillText(callout.text, callout.x, callout.y - callout.age * 40);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, HEIGHT - 20);
  ctx.textAlign = 'right';
  ctx.fillText(`Casts ${state.castsLeft}/${CASTS_PER_ROUND}`, WIDTH - 16, HEIGHT - 20);
  ctx.textAlign = 'center';
  ctx.font = canvasFont('small');
  ctx.fillText('Hold to lower the hook, let go to hold it still', WIDTH / 2, HEIGHT - 22);

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Out of casts! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 40);
  }
}

export const hookADuck: CarnivalGame = {
  id: 'hook-a-duck',
  name: 'Hook a Duck',
  description:
    'Lower the hook gently onto a passing duck. Each duck scores the number on its base.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;
    let pictures = loadPictures(lookFor(getActiveSkin().id));
    const stopSkinChange = onSkinChange((skin) => (pictures = loadPictures(lookFor(skin.id))));

    const press = () => {
      if (state.phase === 'over') {
        state = createState();
        scoreRecorded = false;
      } else {
        lower(state);
      }
    };
    const release = () => hold(state);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      event.preventDefault();
      if (!event.repeat) press();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') release();
    };
    canvas.addEventListener('pointerdown', press);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    // A release outside the window never reaches it, so losing focus lets go too.
    window.addEventListener('blur', release);

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't teleport everything.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      step(state, dt);
      if (state.phase === 'over' && !scoreRecorded) {
        recordScore(hookADuck.id, state.score);
        scoreRecorded = true;
      }
      draw(ctx, state, pictures);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      stopSkinChange();
      canvas.removeEventListener('pointerdown', press);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', release);
    };
  },
};

export default hookADuck;
