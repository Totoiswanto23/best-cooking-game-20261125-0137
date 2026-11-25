# best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Totoiswanto23/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Totoiswanto23/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Sizzle & Serve: The Burnt Toast Bistro** — a complete, original timed cooking game. You are Chef Pip, running a tiny bistro where the orders never stop and the grill never cools. Chop tomatoes, grill patties, fry eggs, toast sourdough, stack dishes on the plate and ring the bell before hungry customers storm out. Four funny recipes, a combo tip system, burnt food (the smoke alarm approves), and a shift timer that keeps the pressure on.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser and click **START SHIFT**.

Or open `game/index.html` directly from any static file server — the game is plain static files under `game/` with no build step and no network requests. All art is drawn on canvas and all sound is synthesized with WebAudio.

## How to play

- **Click** an ingredient bin (or press **1–7**) to pick it up.
- **Click a station** to cook it: chopping board (lettuce, tomato), grill (patty), frying pan (egg), toaster (bread). Click a finished item to move it to the prep tray — leave it too long and it burns.
- **Click the prep tray** to stack items on the plate. Click the plate to take the top item off.
- **Click a ticket** on the order board (or the serve bell, or press **Space**) to serve the plate. A matching dish pays the price plus a speed tip and a combo tip.
- **T** tosses what's in your hand, **P** pauses, **M** mutes, **R** restarts.

## Screenshots

`?shot=start|play|serve|end` stages a real frame of the game (played forward from a fresh world with a fixed seed) for screenshots: the title over a waiting kitchen, a dish mid-assembly, a plate ready to serve, and the end-of-shift results.

---

<sub>Entered on [make.fun](https://make.fun/?ref=r011v8ch&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
