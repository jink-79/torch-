# Torch

Personal expense tracker (single user). MERN: React + Vite client, Express + MongoDB server.

## Status

- **Sign-in is real:** the client calls the Express API (`/api/auth/*`) with an httpOnly session cookie.
- **Data is still mock:** transactions, rules, imports and preferences are synthetic, in-memory or localStorage
  (`client/src/lib/api.ts`) until the Phase 2 endpoints exist.
- `server/`: config validation, MongoDB connection, single-user auth, every other route locked behind a session.

## Run locally

```sh
npm install
cp server/.env.example server/.env   # then fill in MONGODB_URI and JWT_SECRET
npm run setup-user                   # once: creates the only user, then registration is closed
npm run dev:server                   # API on http://localhost:4000
npm run dev                          # app on http://localhost:5173 (proxies /api to :4000)

npm test                             # server tests
npm run typecheck
npm run build
```

## MongoDB Atlas

1. Create a cluster and a **database user** (Database Access) with a long generated password and the
   "Read and write to any database" role. Collections are created automatically; you don't need to make any.
2. **Network Access:** allow the IP of wherever the server runs. If your host has no fixed IP (Render free tier,
   Vercel), you'll need `0.0.0.0/0`. In that case the database password is the only lock, so make it long.
3. **Connect → Drivers:** copy the `mongodb+srv://` string, put the database name in it (`…mongodb.net/torch?…`)
   and paste it into `server/.env` as `MONGODB_URI`. Never commit it and never paste it into chat or an issue.

## Deploy on Vercel (app and API in one project)

The app is static (`client/dist`) and the API is one serverless function (`api/index.js` → `server/src/vercel.ts`).
Both are on the same domain, so the session cookie works in iPhone Home Screen mode. Config: `vercel.json`.

1. **Vercel → Project → Settings → Build & Deployment → Root Directory:** clear it (repo root, not `client`).
   Framework preset: Other. Build and output come from `vercel.json`.
2. **Settings → Environment Variables**, scope **Production** only:
   - `MONGODB_URI`: Atlas string including `/torch`
   - `JWT_SECRET`: `openssl rand -base64 48`
   - `APP_ORIGIN`: only if you use a custom domain (defaults to the project's `*.vercel.app` domain)
3. **Atlas → Network Access:** Vercel has no fixed IPs, so allow `0.0.0.0/0`. The database password is the lock.
4. Create your user **from your machine** (Vercel has no shell): `npm run setup-user` with `server/.env`
   pointing at the same database.
5. Redeploy. Preview deployments have no env vars, so their API answers 503 by design (they never touch the
   production database).

Login rate-limit counters are stored in MongoDB (`ratelimits` collection, auto-expiring) because serverless
instances don't share memory.

## Auth model

- One user, ever. `npm run setup-user` creates it and refuses to run again (also enforced by a unique index).
  There is no register route. Forgotten password: `npm run reset-password -w server` (signs out all devices).
- Passwords: argon2id. Session: HS256 JWT in an `httpOnly`, `SameSite=Strict` cookie (`Secure` and the
  `__Host-` prefix in production). Lasts `SESSION_HOURS` (default 7 days).
- Login is rate-limited: 10 failed attempts per IP per 15 min, 30 failed attempts overall per hour.
- Everything under `/api` except `POST /api/auth/login` returns 401 without a session, including unknown paths.
- Requests that change data must come from `APP_ORIGIN` (CSRF defence on top of SameSite).

## Palette

All colours live in `client/src/index.css` as CSS variables (palette "Ink", light and dark). Change them there only.

## iPhone Home Screen

Open the deployed site in Safari → Share → **Add to Home Screen**. It launches full-screen as "Torch" with its
own icon (`client/public/apple-touch-icon.png`, `manifest.webmanifest`). This needs HTTPS. The API must be on
the same origin as the app (serve both from the server with `SERVE_CLIENT=true`, or proxy `/api` through Vercel)
or Safari will drop the login cookie in Home Screen mode.

## Data hygiene

Only synthetic fixtures are committed. `.env`, `uploads/` and `data/**/*.csv` are git-ignored. Never commit real
statements, UTRs, account numbers or connection strings.
