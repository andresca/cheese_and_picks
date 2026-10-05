# Cheese Picks

Cheese-table ordering site with a step-by-step builder, WhatsApp order delivery and an admin console.

## Run
```
npm install
npm start            # http://localhost:3000   (admin: http://localhost:3000/admin)
```
Set the admin password with the `ADMIN_PASSWORD` env var (default `admin123` — change it!).
PowerShell: `$env:ADMIN_PASSWORD="my-secret"; npm start`

## How it works
- **Sizes** (Small / Medium / Large) have a base price that includes up to N cheeses, proteins and accompaniments.
- **Fully Custom** has no limits; each item is charged at its own price.
- **Wines & Extras** (and any category marked "unlimited") are always optional paid add-ons — use this for party elements later.
- On confirm, the order is saved and WhatsApp opens with the full summary pre-filled to your number.

## Data
- `data/catalog.json` — settings, sizes, categories, products (editable from the admin console).
- `data/orders.json` — all orders (created automatically; back it up).
