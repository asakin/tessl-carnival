import backdrop from './halloween/backdrop.svg';
import duck from './halloween/duck.svg';

/**
 * Pictures that swap pieces of the booth for a midway skin. Anything a look
 * leaves out is drawn the classic way, with the carnival's theme.
 */
export interface DuckLook {
  /** Fills the booth behind the stream. */
  backdrop?: string;
  /** One rubber duck, facing right. */
  duck?: string;
}

const LOOKS: Record<string, DuckLook> = {
  halloween: { backdrop, duck },
};

/** The booth's look for a midway skin; the classic look for a skin it doesn't know. */
export function lookFor(skinId: string): DuckLook {
  return LOOKS[skinId] ?? {};
}
