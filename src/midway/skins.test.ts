import { describe, expect, it } from 'vitest';
import { defaultPalette, palette } from './palette';
import { createSkinStore, type MidwaySkin } from './skins';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

const NIGHT: MidwaySkin = { id: 'night', name: 'Night', palette: { grass: '#123456' } };

describe('skin store', () => {
  it('starts with the classic skin, registered and active', () => {
    const skins = createSkinStore(memoryStorage());
    expect(skins.list().map((s) => s.id)).toEqual(['classic']);
    expect(skins.get('classic')?.name).toBe('Classic');
    expect(skins.active().id).toBe('classic');
    expect(palette.grass).toBe(defaultPalette.grass);
  });

  it('lists registered skins and refuses a second skin with the same id', () => {
    const skins = createSkinStore(memoryStorage());
    skins.register(NIGHT);
    expect(skins.list().map((s) => s.id)).toEqual(['classic', 'night']);
    expect(skins.get('night')).toBe(NIGHT);
    expect(() => skins.register({ id: 'night', name: 'Again' })).toThrow(/night/);
  });

  it('saves the active skin and puts its palette over the default one', () => {
    const storage = memoryStorage();
    const skins = createSkinStore(storage);
    skins.register(NIGHT);
    skins.setActive('night');
    expect(skins.active()).toBe(NIGHT);
    expect(storage.data.get('tessl-carnival:skin')).toBe('night');
    expect(palette.grass).toBe('#123456');
    expect(palette.path).toBe(defaultPalette.path);

    skins.setActive('classic');
    expect(palette.grass).toBe(defaultPalette.grass);
  });

  it('refuses a skin nobody registered', () => {
    const skins = createSkinStore(memoryStorage());
    expect(() => skins.setActive('missing')).toThrow(/missing/);
    expect(skins.active().id).toBe('classic');
  });

  it('remembers the skin from an earlier visit once it registers', () => {
    const storage = memoryStorage();
    storage.setItem('tessl-carnival:skin', 'night');
    const skins = createSkinStore(storage);
    expect(skins.active().id).toBe('classic');
    skins.register(NIGHT);
    expect(skins.active()).toBe(NIGHT);
    expect(palette.grass).toBe('#123456');
    skins.setActive('classic');
  });

  it('tells listeners when the skin changes, until they stop listening', () => {
    const skins = createSkinStore(memoryStorage());
    skins.register(NIGHT);
    const seen: string[] = [];
    const stop = skins.subscribe((skin) => seen.push(skin.id));
    skins.setActive('night');
    stop();
    skins.setActive('classic');
    expect(seen).toEqual(['night']);
  });

  it('keeps working when storage refuses to read or write', () => {
    const skins = createSkinStore({
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    skins.register(NIGHT);
    expect(skins.active().id).toBe('classic');
    skins.setActive('night');
    expect(skins.active().id).toBe('night');
    skins.setActive('classic');
  });
});
