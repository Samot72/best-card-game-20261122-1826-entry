# Emberfall — Duel of the Four Currents

[![Competition](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![Rank](https://make.fun/badge/best-card-game-20261122-1826/Samot72/best-card-game-20261122-1826-entry/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/Samot72/best-card-game-20261122-1826-entry/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

An original lane-battler card game on a felt table. You duel **Mira the Rival** across three lanes — Ashen Field, Tide Hollow, Storm Rise — with a 30-card deck drawn from four currents:

*"Three lanes. Four currents. Twenty life."*

## How to play

- **Select a card:** click it, or press **1–7**. **Play it:** click a lane (or press **1–3**). **End turn:** Enter, Space, or the END TURN button. **Mute:** M. **Restart:** R.
- Each round your mana refills (1 more crystal per round, up to 10) and you draw 2 cards.
- Creatures fight across their lane when the turn ends. A creature with no foe across from it strikes the rival's life instead. Reduce Mira to 0 life to win.
- **Resonance:** two creatures of the same suit sharing a lane get +1/+1 — the pair glows and shows LINK +1.
- **Guard** must be struck first in its lane. **Swift** strikes the turn it is played; other creatures wait a turn.
- Spells: Emberbolt (3 damage to a creature or the rival — click a target), Tidewell (mend 5, draw 1), Thornwall (raise a 0/5 Guard wall in a lane you choose), Galestrike (2 to every enemy creature), Ember Nova (4 to the rival), Tidecall (draw 3).
- Creatures carry their own tricks: Tide Sprite and Wind Herald draw a card when played, Mist Monk mends 2, Pyre Sage burns the rival for 1 each of your turns, Dryad Keeper mends 1, Storm Titan strikes the rival for 2, and the Thorn Queen gives your other Thorn creatures +1 attack.

## The four currents

| Suit | Colour | Shape | Temper |
| --- | --- | --- | --- |
| Ember | red | flame | burn, direct damage |
| Tide | blue | droplet | draw, mend |
| Thorn | green | leaf | guard, growth |
| Gale | amber | bolt | swift, wide strikes |

Suits are told apart by colour **and** shape, never by text alone; every card's art is an original SVG sigil drawn for this game, and the sounds are synthesized in the browser — no files, no network.

## Files

- `game/index.html` — the page; loads only files under `game/`, no network requests.
- `game/src/config.js` — every tuning number the rules use.
- `game/src/cards.js` — the four suits, the sigil art, and all 26 card designs.
- `game/src/deck.js` — the seeded shuffle and the 30-card deck.
- `game/src/state.js` — the game itself: turns, mana, combat, Resonance, win and loss.
- `game/src/ai.js` — Mira's heuristic: lethal checks, threat removal, lane picks.
- `game/src/render.js` — the DOM table: lanes, hands, heroes, log, title/win/loss screens.
- `game/src/input.js` — click and keyboard play, spell targeting, the AI turn sequence.
- `game/src/audio.js` — WebAudio bleeps for select, play, hit, heal, win and loss.
- `game/src/shots.js` — the `?shot=title|play|win|loss` staging (real game states, same renderer).
- `game/src/main.js` — boot; `?selftest=1` drives the real click handlers and reports PASS/FAIL in the title.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with `vendor/makefun-game.ts`.
- `screenshots/` — four real renders of the running game (title, table, win, loss), 1280×720.

## Run it

```sh
node serve.ts            # serves game/ at http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # build the hand-in output
```
