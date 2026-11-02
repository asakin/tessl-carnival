---
name: review-carnival-house-rules
description: Review a change to a carnival game for house rules 1 to 3 in AGENTS.md: the game registers on the midway, reports its score through recordScore from src/carnival, and draws with theme and canvasFont. Use as one lens in a code review run on changes under src/games/.
---

# Review lens: Carnival House Rules

Review whether a game under `src/games/` keeps the carnival's first three house rules, the ones that make it one carnival rather than a pile of separate games.

## Scope

- **Registration** A game lives in `src/games/<game-id>/`, its `game.ts` has its `CarnivalGame` as the default export, and the game's `id` matches its folder name.
- **Scores** A game reports its score by calling `recordScore(game.id, score)` from `src/carnival` once, when a round ends. It does not read or write local storage itself, or keep its own high score table.
- **Theme** A game takes its colours, fonts and sizes from `theme` and `canvasFont` in `src/carnival/theme.ts`, never from its own hex colour, colour name, `rgb()` value or font string.

## Method

Read house rules 1 to 3 in the root `AGENTS.md`, and `src/carnival/index.ts` for what the shared module exports.

For each changed `game.ts`, check its default export and compare the exported game's `id` with the folder name.

Trace every place a round can end, a win, a loss, a timer running out or a restart, and count the `recordScore` calls on that path. Look for `localStorage`, `sessionStorage`, or a module-level best score or score list that outlives a round.

Read each value assigned to `fillStyle`, `strokeStyle`, `shadowColor`, `font` or a gradient stop, and each colour or font set on a DOM element, back to where it comes from.

## Threshold

Report a game that breaks one of the three rules in code this change adds or modifies.

Only report code inside `src/games/`. `src/carnival/` defines the theme and the scores module, and `src/midway/palette.ts` keeps its own scenery colours built on the theme.

Do not report:

- A value derived from the theme, such as a colour from `theme.colors` with transparency added, a size computed from `theme.font` or `theme.canvas`, or a string built from `canvasFont`.
- Test data in `game.test.ts`, which can use any scores, colours or ids it needs.
- Anything lint, the type-checker or the tests already catch. `src/games/index.test.ts` already fails when a folder's game is not registered, so a missing default export or an `id` that differs from its folder fails `npm run check` before review.

## Reporting

- Name the rule, the file and the line, and what the code does instead.
- State the consequence accurately, from what `src/games/index.ts` does today. A game whose `game.ts` has no default export gets no booth, and an `id` that differs from its folder name breaks the house rule; in both cases that loader throws, so the whole midway fails to load, not only the one booth. A missing or repeated `recordScore` call leaves the best score on the game's booth card missing or wrong. A hard-coded colour or font looks out of place now and stops following the theme when it changes.
- Name the fix: the `theme` key or `canvasFont` size to use, where the single `recordScore` call belongs, or the export to add.
