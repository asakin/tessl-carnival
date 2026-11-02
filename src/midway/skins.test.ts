import { describe, expect, it } from 'vitest';
import { defaultPalette, palette } from './palette';
import { visitorLook } from './render';
import {
  CLASSIC_SKIN,
  createSkinStore,
  gameName,
  getSkin,
  listSkins,
  type CarouselLook,
  type MidwaySkin,
} from './skins';
import { HALLOWEEN_SKIN } from './skins/halloween';
import { THANKSGIVING_SKIN } from './skins/thanksgiving';

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
    expect(listSkins().map((s) => s.id)).toEqual(['classic', 'halloween', 'thanksgiving']);
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
      'tree',
      'cart',
      'balloons',
    ] as const)
      expect(sprites[key]).toMatch(/\.svg$|^data:image\/svg\+xml/);
  });

  it('recolours the carousel with skeleton horses instead of a still picture', () => {
    expect(HALLOWEEN_SKIN.sprites?.carousel).toBeUndefined();
    const look = HALLOWEEN_SKIN.carousel!;
    expect(look.skeletal).toBe(true);
    expect(look.eyes).toBe(HALLOWEEN_SKIN.zombies!.eyes);
    expect(look.tattered).toBe(true);
    expect(look.lantern).toBeDefined();
  });

  it('needs at least one horse colour and one trim colour', () => {
    const look = HALLOWEEN_SKIN.carousel!;
    // @ts-expect-error an empty list leaves the horses without a colour
    const noHorses: CarouselLook = { ...look, horses: [] };
    // @ts-expect-error an empty list leaves the trim without a colour
    const noTrim: CarouselLook = { ...look, trim: [] };
    const oneEach: CarouselLook = { ...look, horses: ['#e8e0c8'], trim: ['#ff6b1a'] };
    expect([noHorses, noTrim, oneEach]).toHaveLength(3);
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

describe('thanksgiving skin', () => {
  it('is registered on the midway after the halloween skin', () => {
    expect(listSkins().map((s) => s.id)).toEqual(['classic', 'halloween', 'thanksgiving']);
    expect(getSkin('thanksgiving')).toBe(THANKSGIVING_SKIN);
    expect(THANKSGIVING_SKIN.name).toBe('Thanksgiving');
  });

  it('recolours the sky, ground and paths and swaps the props for SVG sprites', () => {
    const { palette: colors = {}, sprites = {} } = THANKSGIVING_SKIN;
    for (const key of ['sky', 'skyHigh', 'grass', 'path', 'hedge', 'red', 'gold'] as const) {
      expect(colors[key]).not.toBe(defaultPalette[key]);
      expect(colors[key]).not.toBe(HALLOWEEN_SKIN.palette?.[key]);
    }
    for (const key of [
      'big-top',
      'round-tent',
      'peaked-tent',
      'booth',
      'tree',
      'cart',
      'balloons',
    ] as const) {
      expect(sprites[key]).toMatch(/\.svg$|^data:image\/svg\+xml/);
      expect(sprites[key]).not.toBe(HALLOWEEN_SKIN.sprites?.[key]);
    }
  });

  it('rides turkeys on the spinning carousel instead of a still picture', () => {
    expect(THANKSGIVING_SKIN.sprites?.carousel).toBeUndefined();
    const look = THANKSGIVING_SKIN.carousel!;
    expect(look.turkeys).toBeDefined();
    expect(look.turkeys!.tail.length).toBeGreaterThan(1);
    expect(look.skeletal).toBeUndefined();
    expect(HALLOWEEN_SKIN.carousel!.turkeys).toBeUndefined();
  });

  it('can be chosen as the active skin', () => {
    const skins = createSkinStore(memoryStorage());
    skins.register(THANKSGIVING_SKIN);
    skins.setActive('thanksgiving');
    expect(palette.sky).toBe(THANKSGIVING_SKIN.palette!.sky);
    expect(palette.grass).toBe(THANKSGIVING_SKIN.palette!.grass);
    skins.setActive('classic');
    expect(palette.sky).toBe(defaultPalette.sky);
  });
});

describe('game titles', () => {
  const games = [
    { id: 'hook-a-duck', name: 'Hook a Duck' },
    { id: 'ring-toss', name: 'Ring Toss' },
    { id: 'water-cannon', name: 'Water Cannon' },
    { id: 'darts', name: 'Darts' },
  ];

  it('calls the duck booth Hook a Turkey under thanksgiving, and leaves the rest alone', () => {
    expect(games.map((game) => gameName(game, THANKSGIVING_SKIN))).toEqual([
      'Hook a Turkey',
      'Ring Toss',
      'Water Cannon',
      'Darts',
    ]);
  });

  it('keeps every game its own name under classic and halloween', () => {
    for (const skin of [CLASSIC_SKIN, HALLOWEEN_SKIN])
      expect(games.map((game) => gameName(game, skin))).toEqual(games.map((game) => game.name));
  });

  it('follows the active skin when no skin is given', () => {
    const duck = games[0];
    expect(gameName(duck)).toBe('Hook a Duck');
  });

  it('draws the classic gate in every skin', () => {
    for (const skin of listSkins()) expect(skin.sprites?.arch).toBeUndefined();
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

  it('makes some thanksgiving visitors turkeys, and dresses the rest for autumn', () => {
    const turkeys = THANKSGIVING_SKIN.turkeys!;
    const looks = visitors.map((n) => visitorLook(n, THANKSGIVING_SKIN));
    const birds = looks.filter((look) => look.turkey);
    expect(birds.length).toBeGreaterThan(0);
    expect(birds.length).toBeLessThan(looks.length);
    for (const look of birds) {
      expect(look.turkey).toEqual({
        tail: turkeys.tail,
        wattle: turkeys.wattle,
        beak: turkeys.beak,
      });
      expect(turkeys.bodies).toContain(look.shirt);
      expect(turkeys.heads).toContain(look.skin);
      expect(look.zombieEyes).toBeUndefined();
    }
    const skins = createSkinStore(memoryStorage());
    skins.register(THANKSGIVING_SKIN);
    skins.setActive('thanksgiving');
    for (const look of visitors.map((n) => visitorLook(n, THANKSGIVING_SKIN)))
      if (!look.turkey) expect(THANKSGIVING_SKIN.palette!.shirts).toContain(look.shirt);
    skins.setActive('classic');
  });

  it('leaves classic and halloween visitors without turkeys', () => {
    for (const n of visitors) {
      expect(visitorLook(n, CLASSIC_SKIN).turkey).toBeUndefined();
      expect(visitorLook(n, HALLOWEEN_SKIN).turkey).toBeUndefined();
    }
  });

  it('follows the active skin when no skin is given', () => {
    expect(visitorLook(0).zombieEyes).toBeUndefined();
  });
});
