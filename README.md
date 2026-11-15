# Escape from the Econ Monster

Daily econ boss fights for the Highland Academic Decathlon team. Static site, no build step.

## Files
- `index.html` — the page
- `game.js` — engine (fight loop, scene renderer, modes)
- `questions.js` — the question bank (DemiDec Section Exams 1–5 + session case studies). Edit by hand.
- `firebase-config.js` — paste your Firebase web config to turn on the shared Weekly Boss and roster
- `firestore.rules` — paste into Firebase console → Firestore → Rules

## Deploy (GitHub Pages)
1. Push this folder to a repo.
2. Settings → Pages → Source: Deploy from branch, `main`, `/ (root)`.
3. Open `https://<user>.github.io/<repo>/` on a phone. Add to Home Screen for an app icon.

## Turn on cloud saves and team pooling (Firebase, free tier, no personal data)
What it stores: a random save code per phone, a nickname, team code, hero, streak, damage, and which questions were missed. No email, no login, no real names.

1. console.firebase.google.com → Add project → name it `econ-monster` → turn Google Analytics **off** → Create.
2. Build → Authentication → Get started → Sign-in method → enable **Anonymous** → Save.
3. Authentication → Settings → Authorized domains → Add domain → `zuzurocks-2p.github.io`.
4. Build → Firestore Database → Create database → location `us-west` (any) → **Production mode** → Create.
5. Firestore → Rules tab → replace everything with the contents of `firestore.rules` → Publish.
6. Project settings (gear) → Your apps → Web (`</>`) → nickname `econ-monster` → Register → copy the `firebaseConfig` values into `firebase-config.js` → commit and push.

Then:
- Students open the game; a save code is created for them (Bag → Save code). Typing it into a new phone restores everything.
- You pick a team code (e.g. `HHS-ECON`) and students type it on the home screen. Weekly Boss, roster, and Coach Mode then show only that team.
- Coach Mode works from any phone that has the team code entered.

## Tuning
In `game.js`: `TAUGHT` caps which sessions are in play, `TOME_MAX` is per-fight HP, `WEEK_MAX` is the team bar, `CHAPTERS` names the bosses and map locations, `LOOT` is the drop table.
