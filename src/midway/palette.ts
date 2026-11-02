import { theme } from '../carnival';

const { colors } = theme;

/**
 * The midway map's sunset palette. Tent reds, creams and golds come from the
 * carnival theme; the sky, grass, paths and other scenery shades only the map
 * uses live here. It's the classic skin's palette, and the base every other
 * skin's overrides go on top of.
 */
export const defaultPalette = {
  sky: '#f7943c',
  skyHigh: '#8e3b8f',
  cloud: '#bfeafc',
  cloudShade: '#94d8f4',
  haze: '#5fc3b8',

  grass: '#a5c43a',
  grassDark: '#8aab2a',
  grassEdge: '#7a9a22',
  grassLight: '#b6d24c',
  path: '#f3e28e',
  pathShade: '#e2cd70',
  hedge: '#6f9a2c',
  hedgeDark: '#5a8122',
  hedgeLight: '#86b236',
  shadow: 'rgba(60, 90, 10, 0.28)',

  red: colors.stripeA,
  redShade: '#b8283a',
  cream: colors.stripeB,
  creamShade: '#e3d9c2',
  gold: colors.accent,
  goldShade: '#e0a91c',
  blue: '#2b8ccc',
  blueShade: '#1f6aa0',
  sky2: colors.water,
  pink: '#f59ac0',
  pinkShade: '#e076a4',
  wood: colors.wood,
  woodDark: '#6b4429',
  woodLight: '#b7834f',
  board: '#c8955b',
  metal: '#e9e4f2',
  metalShade: '#b9b0cc',
  ink: colors.background,
  opening: '#4a2a28',
  closed: '#a99cc4',
  closedShade: '#8a7daa',
  white: '#ffffff',

  skins: ['#f1c27d', '#c68642', '#8d5524', '#e0ac69', '#ffdbac'],
  hairs: ['#3b2219', '#1b1035', '#a55728', '#e6c35c', '#6b4429'],
  shirts: [colors.water, '#7bd389', '#b48ee0', colors.danger, '#2b8ccc', colors.stripeB],
  pants: ['#2d3a6b', '#3b2a4f', '#5a4a3a'],
  bunting: [colors.stripeA, colors.accent, '#2b8ccc', colors.stripeB],
  balloons: [colors.stripeA, colors.accent, '#2b8ccc', colors.water, '#f59ac0'],
};

/** Every colour as a plain string, so a skin can override the theme's colours too. */
export type MidwayPalette = {
  [K in keyof typeof defaultPalette]: (typeof defaultPalette)[K] extends readonly string[]
    ? string[]
    : string;
};

/**
 * The colours the midway draws with right now: the default palette with the
 * active skin's overrides on top. Read it at draw time, not at import time,
 * so a skin change shows on the next frame.
 */
export const palette: MidwayPalette = { ...defaultPalette };

/** Puts `overrides` over the default palette, dropping any earlier overrides. */
export function applyPalette(overrides: Partial<MidwayPalette> = {}) {
  Object.assign(palette, defaultPalette, overrides);
}
