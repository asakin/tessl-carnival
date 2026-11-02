# Ring Toss

Land rings on the necks of the bottles at the back of the booth.

## How to play

- Move the mouse to aim: the cross shows where a ring thrown now would land.
- The aim sways from side to side by up to 40 px, so time your throw.
- Click to throw a ring. A ring flies for 0.6 seconds before it lands.
- You have 8 rings. The round ends when you are out of rings and the last ring has landed.
- Click again on the game over screen to play another round.

## Scoring

A ring scores when it lands within 14 px of a bottle's neck. Bottles further back score more:

| Row    | Points |
| ------ | ------ |
| Back   | 30     |
| Middle | 20     |
| Front  | 10     |

A ring that misses every neck scores nothing. Your final score is saved to the
carnival's score board when the round ends.

## Files

- `game.ts`: the game logic (`createState`, `throwRing`, `step`, `bottleAt`,
  `swayOffset`) and the `ringToss` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
