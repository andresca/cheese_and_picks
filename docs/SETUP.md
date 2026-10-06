# Production setup: GitHub Pages + Cloudflare Worker + Neon + Zero Trust

How the pieces fit:

```
https://cheese-picks.websportal.dev/            GitHub Pages     storefront + admin.html (static files)
https://cheese-picks.websportal.dev/api/*       Cloudflare Worker → Neon Postgres
https://cheese-picks.websportal.dev/admin*      ┐
https://cheese-picks.websportal.dev/api/admin/* ┘ Cloudflare Access: email one-time PIN first
```

Admin sign-in is **only the email code**: open the admin, enter your email, type the code Cloudflare sends you, and you're in. There's no other password.
- Cloudflare Access only sends codes to the email addresses you allow (step 4).
- The Worker also checks Access's signed token, so the admin API refuses any request that didn't come through the email login, even one sent straight to the Worker.

Do the steps in order. Each one says where it's done.

---

## 1. Neon: database

1. Neon console → your project → **Roles** → `neondb_owner` → **Reset password**. The old one was shared in chat, so treat it as leaked.
2. Copy the new **pooled** connection string. Change `sslmode=require` to `sslmode=verify-full`.
3. Put it in your local `.env` as `DATABASE_URL=...`. It's also used as a GitHub secret in step 5.
4. Locally: `npm run migrate`. It creates or updates the tables and seeds the catalog the first time.

## 2. Cloudflare DNS + SSL

Cloudflare dashboard → **websportal.dev**:

1. **DNS → Records**: there must be exactly one record for the name:
   | Type | Name | Target | Proxy |
   |---|---|---|---|
   | CNAME | `cheese-picks` | `andresca.github.io` | **Proxied** (orange) |

   If GitHub hasn't issued the HTTPS certificate yet ("Enforce HTTPS" can't be ticked), keep it **DNS only** until it has. Then switch it to Proxied.
2. **SSL/TLS → Overview**: choose **Full**. Not "Flexible", which causes an endless redirect loop with GitHub Pages.
3. **SSL/TLS → Edge Certificates**: turn on **Always Use HTTPS**.

## 3. GitHub Pages

Repo → **Settings → Pages**:
- **Source**: GitHub Actions
- **Custom domain**: `cheese-picks.websportal.dev`, with **Enforce HTTPS** ticked

## 4. Cloudflare Zero Trust: email login for the admin

Open **one.dash.cloudflare.com**. The first time, it asks you to pick a team name, such as `cheesepicks`, and the **Free** plan (up to 50 users).

### 4a. Turn on email codes
**Settings → Authentication → Login methods → Add new → One-time PIN**, then save.

### 4b. Create the application
**Access → Applications → Add an application → Self-hosted**:

- **Application name**: `Cheese Picks Admin`
- **Session duration**: `24 hours`
- **Public hostnames**: add one row per path, all with subdomain `cheese-picks` and domain `websportal.dev`:
  | Path |
  |---|
  | `admin.html` |
  | `admin` |
  | `api/admin/*` |
- **Identity providers**: only **One-time PIN**. Tick "Instant Auth" so it skips the chooser.

### 4c. Policy: who can get in
In the same wizard, **Add a policy**:
- **Policy name**: `Admins`
- **Action**: **Allow**
- **Include → Emails**: your address, plus anyone else who should get in.

Save the application. Everyone not on the list is blocked.

### 4d. Copy two values for the Worker
- **Team domain**: Settings → Custom pages (or the address bar on the login page). It looks like `cheesepicks.cloudflareaccess.com`.
- **AUD tag**: Access → Applications → Cheese Picks Admin → **Overview** → *Application Audience (AUD) Tag*.

Put them in `wrangler.toml`. They aren't secret, so they can be committed:
```toml
[vars]
ACCESS_TEAM_DOMAIN = "cheesepicks.cloudflareaccess.com"
ACCESS_AUD = "paste-the-aud-tag-here"
```
Until both are filled in, the admin API answers *"Admin is locked"* (fail-closed).

## 5. Cloudflare Worker: secrets and deploy credentials

Locally, once:
```bash
npx wrangler login                     # opens the browser
npx wrangler secret put DATABASE_URL   # paste the Neon URL from step 1
```
The `secret put` creates the Worker if it doesn't exist yet.

Create a token for GitHub Actions: Cloudflare dashboard → **My Profile → API Tokens → Create Token → "Edit Cloudflare Workers"** template.
- Account resources: your account
- Zone resources: `websportal.dev`

Copy your **Account ID** from the dashboard home (right sidebar, "Account ID").

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:
| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | the token above |
| `CLOUDFLARE_ACCOUNT_ID` | your account ID |
| `DATABASE_URL` | the Neon URL; used only to run migrations |

## 6. Deploy

Push to `main`, or Actions → **Deploy** → Run workflow. The workflow:
1. runs `npm run migrate` against Neon;
2. deploys the Worker on `cheese-picks.websportal.dev/api/*`;
3. publishes `public/` to GitHub Pages.

## 7. Check it

| Test | Expected |
|---|---|
| `https://cheese-picks.websportal.dev/` | Storefront with the real catalog from the database |
| Place a test order | WhatsApp opens; the order appears in the admin |
| `/admin.html` in a private window | Cloudflare email-code screen; only allowed emails get a code |
| After the email code | The admin opens directly; **Log out** ends the Cloudflare session |
| `curl https://cheese-picks.websportal.dev/api/admin/orders` | Redirect to Cloudflare login, never data |

---

## Local development

```bash
cp .dev.vars.example .dev.vars   # DATABASE_URL, DEV_SKIP_ACCESS=true
npm run dev                      # http://localhost:8787  (admin: http://localhost:8787/admin)
```
`DEV_SKIP_ACCESS` skips the email step **only on localhost**. On the real domain it is ignored.

## Changing the database schema

Add `migrations/00N_description.sql`. Never edit a migration that has already run. The next deploy applies it, or run `npm run migrate` yourself.

## Rotating secrets

- Database password: reset in Neon → `npx wrangler secret put DATABASE_URL` → update the GitHub secret and `.env`/`.dev.vars`.
- Give or remove admin access: edit the email list in the `Admins` policy in Zero Trust. Changes apply at the person's next sign-in; to cut someone off right away, also use Access → Users → Revoke.
