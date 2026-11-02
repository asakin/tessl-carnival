import { describe, expect, it } from 'vitest';
import { defaultPalette, palette } from './palette';
import { visitorLook } from './render';
import { CLASSIC_SKIN, createSkinStore, getSkin, listSkins, type MidwaySkin } from './skins';
import { HALLOWEEN_SKIN } from './skins/halloween';

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

describe('halloween skin', () => {
  it('is registered on the midway after the classic skin', () => {
    expect(listSkins().map((s) => s.id)).toEqual(['classic', 'halloween']);
    expect(getSkin('halloween')).toBe(HALLOWEEN_SKIN);
    expect(HALLOWEEN_SKIN.name).toBe('Halloween');
  });

  it('recolours the sky, ground and paths and swaps the props for SVG sprites', () => {
    const { palette: colors = {}, sprites = {} } = HALLOWEEN_SKIN;
    for (const key of ['sky', 'skyHigh', 'grass', 'path', 'hedge', 'red', 'gold'] as const)
      expect(colors[key]).not.toBe(defaultPalette[key]);
    for (const key of [
      'big-top',
      'round-tent',
      'peaked-tent',
      'booth',
      'arch',
      'tree',
      'cart',
      'balloons',
      'carousel',
    ] as const)
      expect(sprites[key]).toMatch(/\.svg$|^data:image\/svg\+xml/);
  });

  it('can be chosen as the active skin', () => {
    const storage = memoryStorage();
    const skins = createSkinStore(storage);
    skins.register(HALLOWEEN_SKIN);
    skins.setActive('halloween');
    expect(skins.active()).toBe(HALLOWEEN_SKIN);
    expect(storage.data.get('tessl-carnival:skin')).toBe('halloween');
    expect(palette.sky).toBe('#1c1033');
    expect(palette.grass).toBe('#26301a');
    expect(palette.path).toBe('#524b63');
    skins.setActive('classic');
    expect(palette.sky).toBe(defaultPalette.sky);
  });
});

describe('visitor looks', () => {
  const visitors = Array.from({ length: 9 }, (_, n) => n);

  it('dresses every classic visitor from the palette, with no zombies', () => {
    for (const n of visitors) {
      const look = visitorLook(n, CLASSIC_SKIN);
      expect(look.zombieEyes).toBeUndefined();
      expect(defaultPalette.skins).toContain(look.skin);
      expect(defaultPalette.shirts).toContain(look.shirt);
    }
  });

  it('makes some halloween visitors zombies, and leaves the rest as they were', () => {
    const zombies = HALLOWEEN_SKIN.zombies!;
    const looks = visitors.map((n) => visitorLook(n, HALLOWEEN_SKIN));
    const undead = looks.filter((look) => look.zombieEyes);
    expect(undead.length).toBeGreaterThan(0);
    expect(undead.length).toBeLessThan(looks.length);
    for (const look of undead) {
      expect(look.zombieEyes).toBe(zombies.eyes);
      expect(zombies.skins).toContain(look.skin);
      expect(zombies.shirts).toContain(look.shirt);
      expect(defaultPalette.skins).not.toContain(look.skin);
    }
    visitors.forEach((n) => {
      if (!looks[n].zombieEyes) expect(looks[n]).toEqual(visitorLook(n, CLASSIC_SKIN));
    });
  });

  it('follows the active skin when no skin is given', () => {
    expect(visitorLook(0).zombieEyes).toBeUndefined();
  });
});
