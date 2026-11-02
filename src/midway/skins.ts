import { applyPalette, type MidwayPalette } from './palette';
import { HALLOWEEN_SKIN } from './skins/halloween';
import type { PropKind } from './world';

/** A piece of the midway a skin can swap for a picture. */
export type SpriteKey = PropKind | 'booth' | 'arch' | 'tree' | 'cloud';

/** Zombies a skin mixes in among the visitors, with the colours they're drawn in. */
export interface ZombieVisitors {
  /** One visitor in every `every` is a zombie. */
  every: number;
  skins: string[];
  hairs: string[];
  shirts: string[];
  pants: string[];
  /** The colour their eyes glow. */
  eyes: string;
}

/** Two alternating stripe colours, each with a shade for the side in shadow. */
export interface StripeColors {
  a: string;
  aShade: string;
  b: string;
  bShade: string;
}

/** The carousel's colours. It still spins and bobs; only its look changes. */
export interface CarouselLook {
  /** The deck's striped rim, and its floor. */
  rim: StripeColors;
  floor: string;
  floorShade: string;
  poles: string;
  /** The horses, alternating round the ring. */
  horses: readonly [string, ...string[]];
  saddle: string;
  /** Skeleton horses: a spine and ribs instead of a solid body. */
  skeletal?: boolean;
  /** The colour the horses' eyes glow; without it, they have no eyes drawn. */
  eyes?: string;
  /** The centre column, and the stripe up its middle. */
  column: string;
  columnStripe: string;
  /** A jack-o'-lantern on the centre column, in this colour. */
  lantern?: string;
  lanternFace?: string;
  canopy: StripeColors;
  trim: readonly [string, ...string[]];
  /** Ragged trim, torn to different lengths. */
  tattered?: boolean;
  flag: string;
}

/**
 * A look for the midway. A skin can recolour the map and swap pieces of it for
 * SVG pictures; anything it leaves out is drawn the classic way.
 */
export interface MidwaySkin {
  id: string;
  name: string;
  /** Colours to use instead of the default palette's. */
  palette?: Partial<MidwayPalette>;
  /** An SVG asset URL or data URL per piece, fitted to that piece's box. */
  sprites?: Partial<Record<SpriteKey, string>>;
  /** The carousel's colours; without it, the classic carousel. A carousel sprite wins over it. */
  carousel?: CarouselLook;
  /** Zombies among the visitors; without it, every visitor looks the classic way. */
  zombies?: ZombieVisitors;
}

type SkinStorage = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'tessl-carnival:skin';

export const CLASSIC_SKIN: MidwaySkin = { id: 'classic', name: 'Classic' };

function memoryStorage(): SkinStorage {
  const memory = new Map<string, string>();
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => void memory.set(key, value),
  };
}

export function createSkinStore(storage: SkinStorage) {
  let store = storage;
  const byId = new Map<string, MidwaySkin>([[CLASSIC_SKIN.id, CLASSIC_SKIN]]);
  const listeners = new Set<(skin: MidwaySkin) => void>();

  function storedId(): string {
    try {
      return store.getItem(STORAGE_KEY) ?? CLASSIC_SKIN.id;
    } catch {
      return CLASSIC_SKIN.id;
    }
  }

  let activeId = storedId();

  function list(): MidwaySkin[] {
    return [...byId.values()];
  }

  function get(id: string): MidwaySkin | undefined {
    return byId.get(id);
  }

  /** The active skin, or the classic skin when the saved one isn't registered. */
  function active(): MidwaySkin {
    return byId.get(activeId) ?? CLASSIC_SKIN;
  }

  function changed() {
    const skin = active();
    applyPalette(skin.palette);
    for (const listener of listeners) listener(skin);
  }

  function register(skin: MidwaySkin) {
    if (byId.has(skin.id)) throw new Error(`Two skins share the id "${skin.id}"`);
    byId.set(skin.id, skin);
    // A skin saved on an earlier visit can register after the page loads.
    if (skin.id === activeId) changed();
  }

  function setActive(id: string) {
    if (!byId.has(id)) throw new Error(`No skin has the id "${id}"`);
    activeId = id;
    try {
      store.setItem(STORAGE_KEY, id);
    } catch {
      // Storage can refuse a write. Keep the choice for this page load only.
      store = memoryStorage();
      store.setItem(STORAGE_KEY, id);
    }
    changed();
  }

  /** Calls `listener` whenever the active skin changes; returns a function that stops it. */
  function subscribe(listener: (skin: MidwaySkin) => void): () => void {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  }

  applyPalette(active().palette);
  return { list, get, active, setActive, register, subscribe };
}

function browserStorage(): SkinStorage {
  try {
    return window.localStorage;
  } catch {
    // Private windows and test runs: keep the skin for this page load only.
    return memoryStorage();
  }
}

const skins = createSkinStore(browserStorage());
skins.register(HALLOWEEN_SKIN);

export const listSkins = skins.list;
export const getSkin = skins.get;
export const getActiveSkin = skins.active;
export const setActiveSkin = skins.setActive;
export const registerSkin = skins.register;
export const onSkinChange = skins.subscribe;
