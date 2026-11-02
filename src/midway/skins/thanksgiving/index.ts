import type { MidwaySkin } from '../../skins';
import arch from './arch.svg';
import balloons from './balloons.svg';
import bigTop from './big-top.svg';
import booth from './booth.svg';
import cart from './cart.svg';
import peakedTent from './peaked-tent.svg';
import roundTent from './round-tent.svg';
import tree from './tree.svg';

/**
 * A golden autumn afternoon at the carnival: cranberry and pumpkin harvest
 * tents, fiery trees, a pie cart, a carousel of turkeys and turkeys strutting
 * among the visitors.
 */
export const THANKSGIVING_SKIN: MidwaySkin = {
  id: 'thanksgiving',
  name: 'Thanksgiving',
  palette: {
    sky: '#f2a541',
    skyHigh: '#b5562a',
    cloud: '#fbe3b8',
    cloudShade: '#f0c98c',
    haze: '#d98a3d',

    grass: '#b8893a',
    grassDark: '#9c7230',
    grassEdge: '#7f5a26',
    grassLight: '#c99c4a',
    path: '#e3c79a',
    pathShade: '#cfae7c',
    hedge: '#9a4a1f',
    hedgeDark: '#7a3817',
    hedgeLight: '#b85f28',

    red: '#a4243b',
    redShade: '#7c1a2c',
    cream: '#f6ead0',
    creamShade: '#ddcba6',
    gold: '#e0a526',
    goldShade: '#b9831a',
    blue: '#d2691e',
    blueShade: '#a85215',

    shirts: ['#a4243b', '#d2691e', '#e0a526', '#6b7a2f', '#8b4a2b', '#f6ead0'],
    pants: ['#5a3a22', '#3f3a2a', '#6b4429'],
    bunting: ['#a4243b', '#d2691e', '#e0a526', '#8b4a2b', '#6b7a2f'],
    balloons: ['#a4243b', '#d2691e', '#e0a526', '#8b4a2b', '#c0392b'],
  },
  sprites: {
    'big-top': bigTop,
    'round-tent': roundTent,
    'peaked-tent': peakedTent,
    booth,
    arch,
    tree,
    cart,
    balloons,
  },
  carousel: {
    rim: { a: '#a4243b', aShade: '#7c1a2c', b: '#e0a526', bShade: '#b9831a' },
    floor: '#c99c4a',
    floorShade: '#a97e36',
    poles: '#e0a526',
    horses: ['#7a4a26', '#5e3a1f'],
    saddle: '#a4243b',
    turkeys: {
      tail: ['#a4243b', '#d2691e', '#e0a526'],
      wattle: '#d2232a',
      beak: '#f2c230',
    },
    column: '#8b4a2b',
    columnStripe: '#e0a526',
    canopy: { a: '#d2691e', aShade: '#a85215', b: '#f6ead0', bShade: '#ddcba6' },
    trim: ['#a4243b', '#e0a526', '#d2691e'],
    flag: '#a4243b',
  },
  turkeys: {
    every: 3,
    bodies: ['#6b4226', '#5a3620', '#7a4a26'],
    wings: ['#3f2614', '#8b5a2b'],
    heads: ['#c9d3e0', '#e8b4a8'],
    tail: ['#a4243b', '#d2691e', '#e0a526'],
    wattle: '#d2232a',
    beak: '#f2c230',
    legs: '#d9a032',
  },
};
