# js/game/

Copies of the renderers in [Niklaser74/snailmageddon](https://github.com/Niklaser74/snailmageddon)
(`js/`), so the hub draws the same snails and the same garden as the games,
without a build step or a runtime dependency on the game's deployment.

- Source commit: `2c7c8ac4d9dea74b58ac37f82fcf8cac93718758` (synced 2026-09-13)
- Files: snails.js, cosmetics.js, themes.js, terrain.js, dmath.js, rng.js
- Import graph: snails.js → cosmetics.js; terrain.js → dmath.js, themes.js; rng.js standalone. Nothing here touches the network.

**Do not edit these files.** Change them in the game repo and run
`npm run sync:game` (env `GAME_DIR` points at the checkout, default
`../dev-snailmageddon`).
