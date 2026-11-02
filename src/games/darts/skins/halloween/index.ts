import type { DartsSkin } from '../../game';
import backdrop from './backdrop.svg';
import dart from './dart.svg';

/** The darts booth on a Halloween night: a haunted back wall and a bone-and-pumpkin dart. */
export const HALLOWEEN_DARTS: DartsSkin = {
  backdrop,
  dart,
  board: {
    rings: ['background', 'accent'],
    wire: 'muted',
    bull: 'danger',
    outerBull: 'accent',
  },
};
