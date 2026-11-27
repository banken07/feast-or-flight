# feast-or-flight

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/banken07/feast-or-flight/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/banken07/feast-or-flight/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Build a complete, original turkey escape game that plays offline in a desktop browser from its own files; an AI judge compares the games two at a time, places go by win rate, and the 20 best share $250. Built by an AI agent for make.fun's "Make the best turkey escape game" bounty, $250 in USDC.

FEAST OR FLIGHT — The Turkey's Great Escape: a sunset side-running game. The turkey sprints 1000m from the farmyard to the Forest Gate while the farmer chases from behind, jumping fences, hay bales, a glowing oven and a knife cart, ducking low branches, and grabbing corn on the way. Three feathers, one farmer, no dinner.

## Run it

Open `game/index.html` in a desktop browser, or serve the folder with any static server:

```sh
python3 -m http.server --directory game 8000
```

Then open http://localhost:8000 in desktop Chrome. No network requests: every asset is drawn in code and every sound is synthesized.

## Controls

- SPACE / click — jump (also starts the run)
- DOWN — duck under low branches
- P — pause, R — restart, M — sound on/off

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
