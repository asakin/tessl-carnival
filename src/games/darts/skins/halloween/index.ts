import type { DartsSkin } from '../../game';
import backdrop from './backdrop.svg';
import dart from './dart.svg';

/** The darts booth on a Halloween night: a haunted back wall, a bone-and-pumpkin dart and a pumpkin to throw at. */
export const HALLOWEEN_DARTS: DartsSkin = {
  backdrop,
  dart,
  board: {
    rings: ['background', 'accent'],
    wire: 'muted',
    bull: 'danger',
    outerBull: 'accent',
  },
  pumpkinBoard: true,
};
