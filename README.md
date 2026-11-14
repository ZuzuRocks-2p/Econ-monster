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

## Turn on team pooling (Firebase, free tier)
1. console.firebase.google.com → Add project (Analytics off).
2. Build → Authentication → Get started → enable **Anonymous**.
3. Build → Firestore Database → Create (production mode) → Rules tab → paste `firestore.rules` → Publish.
4. Project settings → Your apps → Web (`</>`) → register → copy the config object into `firebase-config.js`.
5. Authentication → Settings → Authorized domains → add `<user>.github.io`.
6. Commit and push. Every fight now pools into the Weekly Boss and the roster.

## Tuning
In `game.js`: `TAUGHT` caps which sessions are in play, `TOME_MAX` is per-fight HP, `WEEK_MAX` is the team bar, `CHAPTERS` names the bosses and map locations, `LOOT` is the drop table.
