# Torch

Personal expense tracker (single user). MERN: React + Vite client, Express + MongoDB server.

## Status

- `client/`: all screens are built against an **in-memory mock API** (`client/src/lib/api.ts`). The data is
  synthetic and resets on reload, and the mock login accepts any password. It is not wired to the server yet.
- `server/`: Phase 1 is done: config validation, MongoDB connection, single-user auth (setup command, login,
  logout, `/me`), and every other route locked behind a session. No transaction data endpoints yet.

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
