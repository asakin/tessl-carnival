import type { MidwaySkin } from '../../skins';
import balloons from './balloons.svg';
import bigTop from './big-top.svg';
import booth from './booth.svg';
import cart from './cart.svg';
import peakedTent from './peaked-tent.svg';
import roundTent from './round-tent.svg';
import tree from './tree.svg';

/**
 * A spooky night at the carnival: pumpkin tents, bare trees, a bubbling
 * cauldron, a carousel of skeleton horses and zombies among the visitors.
 */
export const HALLOWEEN_SKIN: MidwaySkin = {
  id: 'halloween',
  name: 'Halloween',
  palette: {
    sky: '#1c1033',
    skyHigh: '#0d071a',
    cloud: '#3a2759',
    cloudShade: '#281940',
    haze: '#47296b',

    grass: '#26301a',
    grassDark: '#1c2413',
    grassEdge: '#151c0e',
    grassLight: '#313d22',
    path: '#524b63',
    pathShade: '#3f394f',
    hedge: '#1e2b18',
    hedgeDark: '#141d10',
    hedgeLight: '#2b3d23',

    red: '#ff6b1a',
    redShade: '#c94a09',
    cream: '#f3e9d2',
    creamShade: '#d4c5a9',
    gold: '#ffb703',
    goldShade: '#d48c00',
    blue: '#7b2cbf',
    blueShade: '#5a189a',

    bunting: ['#ff6b1a', '#7b2cbf', '#f3e9d2', '#7be05a'],
    balloons: ['#ff6b1a', '#7b2cbf', '#f3e9d2', '#7be05a', '#ffb703'],
  },
  sprites: {
    'big-top': bigTop,
    'round-tent': roundTent,
    'peaked-tent': peakedTent,
    booth,
    tree,
    cart,
    balloons,
  },
  carousel: {
    rim: { a: '#3a2759', aShade: '#281940', b: '#1a1020', bShade: '#120a18' },
    floor: '#2a1f3d',
    floorShade: '#1c1430',
    poles: '#6b5a3a',
    horses: ['#e8e0c8', '#b9ae94'],
    saddle: '#7b2cbf',
    skeletal: true,
    eyes: '#7be05a',
    column: '#3f394f',
    columnStripe: '#7b2cbf',
    lantern: '#ff6b1a',
    lanternFace: '#ffb703',
    canopy: { a: '#5a189a', aShade: '#3c1066', b: '#1a1020', bShade: '#100a14' },
    trim: ['#ff6b1a', '#c94a09'],
    tattered: true,
    flag: '#7b2cbf',
  },
  zombies: {
    every: 3,
    skins: ['#8fae6b', '#9aa58c', '#7d9467'],
    hairs: ['#2a2233', '#3f394f', '#524b63'],
    shirts: ['#3f394f', '#2a1f3d', '#4a3b2a'],
    pants: ['#1a1020', '#2b2433'],
    eyes: '#7be05a',
  },
};
