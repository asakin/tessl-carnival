import { applyPalette, type MidwayPalette } from './palette';
import type { PropKind } from './world';

/** A piece of the midway a skin can swap for a picture. */
export type SpriteKey = PropKind | 'booth' | 'arch' | 'tree' | 'cloud';

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

export const listSkins = skins.list;
export const getSkin = skins.get;
export const getActiveSkin = skins.active;
export const setActiveSkin = skins.setActive;
export const registerSkin = skins.register;
export const onSkinChange = skins.subscribe;
