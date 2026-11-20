# Tests

No framework, no dependencies, no build. Just Node and the engine's own source.

```sh
sh test/run.sh              # all of them
sh test/run.sh loot rules   # just those
```

9 suites, 145 checks. The runner exits non-zero if any fail, so it works in CI as-is.

## How they work

The game is plain scripts that assume a browser. Each suite builds a **fake DOM out of a
`Proxy`** that answers every property access with another proxy, reads the real
`questions.js` / `bosses.js` / `campus.js` / `music.js` / `game.js` off disk, and `eval`s them.
That gives direct access to `start()`, `answer()`, `advance()`, `rollLoot()` and the live `S`
and `G` state, so a suite can play a few hundred games in a second and assert on what the
engine actually did.

This catches routing and state bugs that reading the code does not. The duplicate-question bug
showed up in 400 of 400 simulated runs; one playthrough by hand would have missed it.

| suite | what it holds the engine to |
|---|---|
| `reg.js` | every mode plays to a result — all-correct, all-wrong, and all-timeout |
| `blitz.js` | Term Blitz: the 3-second penalty, the clock hitting zero mid-answer, the capped multiplier |
| `qa2.js` | "got it" decay, the coach's per-session accuracy, untaught sessions staying hidden |
| `qa3.js` | a blank team code pools nobody; the post-boss drill never repeats or re-serves a boss |
| `verify.js` | the damage write: atomic increment, merge not overwrite, no write without a team |
| `fc.js` | all 552 questions carry a real concept name, so no card shows a session name as its front |
| `loot.js` | an announced drop is a drop the bag receives; `ITEM_CAP`; the wardrobe stays completable |
| `a2.js` | the home-screen nudge per platform, and that `manifest.json` has the icons install needs |
| `rules.js` | **`firestore.rules` vs. the client** — see below |

## `rules.js` is different

It transcribes `firestore.rules` into JavaScript and runs the writes the engine really emits
through it: a `DB` stub that records payloads, with `FieldValue.increment` resolved the way the
server resolves it. It is the only check that the two files still agree, because nothing
mechanically couples them.

It also guards the coupling that has no other guard: **one `postDamage()` call carries a whole
run, and the rules cap a single write.** Max per hit is `base 35 (heavy) × crit 2.0 ×
COMBO_CAP 1.8 = 126`, so the ceiling is 126 × beats. At 25 beats that is 2898 against a cap of
4000. Raise `RAID.forms`, `RAID.perForm`, `CHAIN`, `COMBO_CAP` or the crit multiplier and this
suite tells you when the cap has to move too. Getting it wrong fails **silently**: `postDamage`
swallows the error, `watchRaid`'s `onSnapshot` error handler is `()=>{}`, and `teamTotal()`
falls back to summing the roster, so the bar still moves and only the best student's damage
disappears.

## Traps, each of which has cost this project real time

**A passing suite is not a working suite.** `run.sh` judges four things, because each of these
has produced a false green here:

- **exit code** — `reg`, `blitz`, `qa2` and `qa3` report a bug by *printing* it. They now tally
  their own failure markers through a `console.log` wrapper and exit 1.
- **failure markers in the output** — in case that tally is what broke.
- **a minimum check count** — a suite that half-runs prints fewer checks and otherwise looks fine.
- **file size** — `open(f,"w")` truncates the target *before* evaluating its argument, so a
  failed write leaves a 0-byte file. An empty suite exits 0. That happened.

**Do not declare a top-level `const` whose name the engine also uses.** These suites `eval` the
engine in their own scope, so a top-level `const T`, `const BANK`, `const bag` collides with
the engine's own `T`/`BANK`/`bag` — either a TDZ error ("Cannot access 'BANK' before
initialization") or a redeclaration. `rules.js` sidesteps the whole class of problem by wrapping
its body in an IIFE. Do that.

**`const` inside `eval` is block-scoped**, so the eval'd engine's `const BANK` is not visible
afterwards. The headers append explicit `globalThis.__t = {…}` export blocks for this reason.

**`navigator` is a read-only accessor in Node 24.** `global.navigator = {…}` silently does
nothing, which made all 13 platform branches in `a2.js` return `""` and pass. Use
`Object.defineProperty(globalThis, 'navigator', {configurable: true, writable: true, value: …})`.

**`grep -c` counts lines, not occurrences.** An assertion written against it will be off
wherever a line holds the string twice.

## Verifying a deploy

The suites read whatever is on disk, so point them at the deployed bytes rather than the repo:

```sh
curl -H 'Cache-Control: no-cache' -o game.js 'https://zuzurocks-2p.github.io/Econ-monster/game.js?cb=1'
```

Fetch each engine file that way, blank `apiKey` in `firebase-config.js` so nothing can touch the
live database, then run the suites against that copy.

**Never read HEAD through `raw.githubusercontent.com`** — it is CDN-cached and has served this
repo a pre-merge file hours after the merge. A whole feature got built on one of those. Use:

```sh
gh api 'repos/ZuzuRocks-2p/Econ-monster/contents/game.js?ref=main' -H 'Accept: application/vnd.github.raw'
```

## Also worth knowing

`firestore.rules` does **not** deploy from this repo. It has to be pasted into Firebase console →
Firestore → Rules → Publish. If a new collection's writes are being denied, that is why, and
`rules.js` cannot tell you — it only proves the file and the client agree, not that the file is live.

Changing any `.js` file means bumping its `?v=` tag in `index.html`. Pages serves
`max-age=600`, and without a bump returning phones keep the cached build.
