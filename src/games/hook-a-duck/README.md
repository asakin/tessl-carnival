# Hook a Duck

Rubber ducks float round a stream in a loop. Lower the hook on the rod to catch
one by the ring on its head as it passes.

## How to play

- Hold the mouse button (or the space bar) to lower the hook, and let go to hold
  it still. The hook speeds up the longer you hold, so lower it in short taps.
  Switching away from the window lets go too.
- Catch a duck by bringing the hook down onto the ring on its head while the
  line is still pale. A red line means the hook is moving too fast.
- A cast misses if the hook comes down too fast, lands on the duck's back instead
  of its ring, or drops into empty water. A missed duck sinks a little and can't
  be caught until it bobs back up.
- A hook left hanging catches nothing: it has to be moving down onto the ring.
- You have 6 casts. Every cast ends with a catch or a miss, then the hook reels
  back up. The round ends when the last cast is reeled in.
- Click again on the game over screen to play another round.

## Scoring

Each duck has a number on its base, and a caught duck scores that number. The
ducks carry 10, 20, 30 or 50 points, and you see the number when you reel the
duck in. Misses score nothing.

Your final score is saved to the carnival's score board when the round ends.

## Skins

The booth follows the midway's skin. Under the Halloween skin it swaps in a
night backdrop and pumpkin ducks in witch hats; under any other skin it draws
the classic way, with the carnival's theme.

## Files

- `game.ts`: the game logic (`createState`, `lower`, `hold`, `castResult`, `step`)
  and the `hookADuck` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
- `skins.ts`: the pictures each midway skin uses for the booth.
- `halloween/`: the Halloween skin's SVGs, `backdrop.svg` and `duck.svg`.
