# Darts

Throw darts at the board hanging at the back of the booth.

## How to play

- Move the mouse to aim: the cross shows where a dart thrown now would land.
- The aim drifts around the cursor by up to 30 px each way, so time your throw.
- Click to throw a dart. A dart flies for 0.35 seconds before it lands.
- You have 5 darts. The round ends when you are out of darts and the last dart has landed.
- Click again on the game over screen to play another round.

## Scoring

A dart scores by the ring it lands in. A dart on the line between two rings
scores the inner ring.

| Ring          | Out to | Points |
| ------------- | ------ | ------ |
| Bullseye      | 10 px  | 50     |
| Outer bull    | 24 px  | 25     |
| Inner ring    | 60 px  | 15     |
| Middle ring   | 100 px | 10     |
| Outer ring    | 140 px | 5      |
| Off the board |        | 0      |

The best round is 250. Your final score is saved to the carnival's score board
when the round ends.

## Skins

The booth follows the skin picked on the midway. The Classic skin draws the
booth from the carnival theme. The Halloween skin swaps in a haunted back wall
and a bone and pumpkin dart. The Halloween and Thanksgiving skins both hang a
ribbed pumpkin, with its stem and vine, in place of the round board, and paint
the scoring rings on it in theme colours. The rings are the same size, so
scoring does not change. Any other skin gets the Classic booth.

## Files

- `game.ts`: the game logic (`createState`, `throwDart`, `step`, `pointsAt`,
  `swayOffset`), `dartsSkin`, which picks the booth's look for a midway skin,
  and the `darts` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic and the skins.
- `skins/halloween/`: the Halloween look, `backdrop.svg` and `dart.svg`,
  generated with Recraft V4.1 Vector.
- `skins/thanksgiving/`: the Thanksgiving look, the pumpkin board's ring colours.
