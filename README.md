# Cheese Picks

Cheese-table ordering site with a step-by-step builder, WhatsApp order delivery and an admin console.

## Run
```
npm install
cp .env.example .env   # then fill in DATABASE_URL and ADMIN_PASSWORD
npm start              # http://localhost:3000   (admin: http://localhost:3000/admin)
```
The server won't start without `DATABASE_URL` (Postgres, e.g. Neon) and an `ADMIN_PASSWORD` of at least 12 characters.
Tables are created on first start and the catalog is seeded from `data/catalog.json`.

## Security
- Admin sessions: random token, only its hash is stored in the database, expires after 12 hours; logout revokes it.
- Rate limits: 5 failed logins per 15 min, 10 orders per 15 min, 120 API requests per minute (per IP).
- Security headers (CSP, HSTS, no framing) via helmet; request bodies capped at 200 KB; prices always computed server-side.
- Cross-origin API access only for origins listed in `ALLOWED_ORIGINS`.

## How it works
- **Sizes** (Small / Medium / Large) have a base price that includes up to N cheeses, proteins and accompaniments.
- **Fully Custom** has no limits; each item is charged at its own price.
- **Wines & Extras** (and any category marked "unlimited") are always optional paid add-ons — use this for party elements later.
- On confirm, the order is saved and WhatsApp opens with the full summary pre-filled to your number.

## Data
- Postgres tables: `catalog` (one JSON document, edited from the admin console), `orders`, `admin_sessions`.
- `data/catalog.json` is only the initial seed, and the static catalog for the GitHub Pages build.
