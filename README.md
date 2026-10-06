# Cheese Picks

Cheese-table ordering site with a step-by-step builder, WhatsApp order delivery and an admin console.

## Stack
- **Storefront + admin page**: static files in `public/`, published to GitHub Pages.
- **API**: Cloudflare Worker (`src/`) on `cheese-picks.websportal.dev/api/*`.
- **Database**: Neon Postgres; schema changes in `migrations/`.
- **Admin sign-in**: Cloudflare Access (Zero Trust) email one-time code.

Production setup, step by step: [docs/SETUP.md](docs/SETUP.md).

## Run locally
```
npm install
cp .dev.vars.example .dev.vars   # fill in DATABASE_URL
cp .env.example .env             # same DATABASE_URL, used by npm run migrate
npm run migrate                  # create/update tables, seed the catalog the first time
npm run dev                      # http://localhost:8787   (admin: http://localhost:8787/admin)
```
Locally, `DEV_SKIP_ACCESS=true` skips the email sign-in. It only works on localhost.

## Security
- Admin: only people whose email is in the Cloudflare Access policy can sign in, with a one-time code sent to that email. The Worker verifies Access's signed token on every admin API call and stays locked if Access isn't configured.
- Orders are rate-limited per IP (5 per minute); request bodies are capped at 200 KB; prices are always computed server-side.
- Secrets (`DATABASE_URL`) live only in Worker secrets, GitHub Actions secrets and git-ignored local files.

## How it works
- **Sizes** (Small / Medium / Large) have a base price that includes up to N cheeses, proteins and accompaniments.
- **Fully Custom** has no limits; each item is charged at its own price.
- **Wines & Extras** (and any category marked "unlimited") are always optional paid add-ons — use this for party elements later.
- On confirm, the order is saved and WhatsApp opens with the full summary pre-filled to your number.

## Data
- Postgres tables: `catalog` (one JSON document, edited from the admin console) and `orders`.
- `data/catalog.json` is only the initial seed, and a fallback catalog in the GitHub Pages build if the API can't be reached.
