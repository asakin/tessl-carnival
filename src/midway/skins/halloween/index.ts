import type { MidwaySkin } from '../../skins';
import arch from './arch.svg';
import balloons from './balloons.svg';
import bigTop from './big-top.svg';
import booth from './booth.svg';
import cart from './cart.svg';
import peakedTent from './peaked-tent.svg';
import roundTent from './round-tent.svg';
import tree from './tree.svg';

/** A spooky night at the carnival: pumpkin tents, bare trees and a bubbling cauldron. */
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
    arch,
    tree,
    cart,
    balloons,
  },
};
