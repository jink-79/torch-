# Torch

Personal expense tracker (single user). MERN: React client now, Express + MongoDB server next.

## Status

- `client/`: all six screens (Login, Home, Import, Review, Transactions, Rules) are built against an
  **in-memory mock API** (`client/src/lib/api.ts`). The data is synthetic and resets on reload. The mock login
  accepts any username and password. **Don't deploy this client until the real server and auth exist.**
- `server/`: not started.

## Run

```sh
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run build
```

## Palette

All colours live in `client/src/index.css` as CSS variables (palette "Ink"). Change them there only.

## iPhone Home Screen

Open the deployed site in Safari → Share → **Add to Home Screen**. It launches full-screen as "Torch" with its
own icon (`client/public/apple-touch-icon.png`, `manifest.webmanifest`). This needs HTTPS. The API must be on
the same origin as the app or the login cookie won't survive in Home Screen mode.

## Data hygiene

Only synthetic fixtures are committed. `uploads/` and `data/**/*.csv` are git-ignored. Never commit real
statements, UTRs or account numbers.
