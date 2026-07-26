# FormOS — Hostinger Cloud → VPS Migration Guide

This guide moves FormOS from a Hostinger managed/Cloud hosting plan to a self-managed
**VPS** (Hostinger VPS, or any Ubuntu/Debian VPS). The **Supabase database does not move** —
it stays where it is and the app simply connects to it over the network. This is an
application-server migration only.

---

## 0. What actually changes (and what doesn't)

| Piece | Status |
| --- | --- |
| PostgreSQL database | **No change** — stays on Supabase. Just keep `DATABASE_URL` / `DIRECT_URL`. |
| File uploads (Drive/Dropbox) | **No change** — files go to per-owner cloud storage, not local disk. |
| Stripe webhook endpoint | **No change if the domain stays the same.** Repoint DNS, keep the URL. |
| OAuth redirect URIs (Google/Microsoft/Apple/Facebook/Dropbox/Lark) | **No change if the domain stays the same.** |
| App runtime | **Changes** — you now run/manage the Node process, reverse proxy, and TLS yourself. |

Because uploads and the DB are both off-box, the VPS is **stateless** — you can rebuild it
anytime without losing data. That's the key advantage over the Cloud plan.

> **If your domain also changes**, you must update: `NEXT_PUBLIC_APP_URL`, `APP_URL`, every
> `*_REDIRECT_URI`, `STRIPE_BILLING_PORTAL_RETURN_URL`, the Stripe webhook endpoint in the
> Stripe dashboard, and each OAuth app's redirect URL in its provider console. Keeping the
> same domain avoids all of that.

---

## 1. Provision the VPS

1. Create a VPS (Hostinger VPS: Ubuntu 24.04 LTS template is fine). Give it a public IP.
2. SSH in as root and create a non-root deploy user:

   ```bash
   adduser deploy
   usermod -aG sudo deploy
   # copy your SSH key over, then log in as deploy going forward
   rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
   ```

3. Basic firewall — allow SSH + web only:

   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

   The Node app listens on `3001` internally and is **never** exposed directly — Nginx
   proxies to it. Do not open 3001 in the firewall.

---

## 2. Install the runtime

FormOS uses the latest Next.js + Prisma 7, so use **Node 22 LTS**.

```bash
# Node 22 via nodesource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Build tooling for native deps (bcrypt, pg)
sudo apt-get install -y build-essential git

# Nginx + certbot for TLS
sudo apt-get install -y nginx
sudo apt-get install -y certbot python3-certbot-nginx

node -v   # expect v22.x
```

---

## 3. Get the code onto the VPS

```bash
sudo mkdir -p /var/www/formos
sudo chown deploy:deploy /var/www/formos
cd /var/www/formos
git clone <your-repo-url> .
git checkout main   # or your production branch
```

> Deploy keys / a fine-grained GitHub PAT are the clean way to let the VPS pull. Add the
> VPS SSH key as a **read-only deploy key** on the repo.

---

## 4. Environment variables

Copy `.env.example` to `.env` and fill in the **same values you use on Hostinger Cloud now**.
Nothing about these values changes when the DB stays on Supabase and the domain stays the same.

```bash
cp .env.example .env
nano .env   # or your editor of choice
chmod 600 .env   # keep secrets readable only by the deploy user
```

Key ones for this migration:

- `DATABASE_URL` — **Supabase pooled connection** (PgBouncer, port **6543**). Used by the app
  at runtime. Keep `?pgbouncer=true` if it's in your current value.
- `DIRECT_URL` — **Supabase direct connection** (port **5432**). Used by Prisma CLI /
  `migrate deploy`. `prisma.config.ts` throws at startup if this is missing.
- `AUTH_SECRET` — must be **identical** to the current value, or every existing
  `formos_session` cookie is invalidated and all users are logged out. Copy it exactly.
- `NEXT_PUBLIC_APP_URL` / `APP_URL` — your public HTTPS URL (e.g. `https://formos.com.au`).
- `PORT` — leave unset (defaults to 3001) or set explicitly; must match the Nginx upstream.
- All Stripe / OAuth / Lark keys — copy verbatim from the current environment.

> **Supabase network access:** Supabase Postgres is publicly reachable by default, so the
> VPS can connect straight away. If you've enabled Supabase network restrictions/allowlisting,
> add the VPS's public IP to the allowed list. No other DB change is needed.

> `db.js` in the repo root is an unused scaffold (references a `your_table` table and
> `SUPABASE_URL`/`SUPABASE_ANON_KEY` that the app doesn't use). Ignore it — the app talks to
> Postgres through Prisma, not the Supabase JS client.

---

## 5. Build

```bash
cd /var/www/formos
npm ci                # clean install from package-lock.json
npm run build         # = prisma generate && prisma migrate deploy && next build
```

`npm run build` **applies pending Prisma migrations to Supabase**. Since the same database is
shared with the old Hostinger deployment, its migration state is already up to date, so
`migrate deploy` will normally report "No pending migrations." That's expected — don't run
`prisma db push` or `migrate reset`.

> If this is a brand-new database that has never been migrated, first follow the one-time
> baseline step in `DEPLOYMENT.md` (`prisma migrate resolve --applied 20260531000000_initial_baseline`).
> For a migration off an existing, already-synced Supabase DB, you skip that.

Smoke-test before wiring up the proxy:

```bash
npm start          # starts next on 0.0.0.0:3001
curl -I http://127.0.0.1:3001   # expect a 200/307 from Next
# Ctrl-C once confirmed
```

---

## 6. Run it as a managed service (PM2)

PM2 keeps the app alive, restarts on crash, and starts on boot.

```bash
sudo npm install -g pm2

cd /var/www/formos
pm2 start npm --name formos -- start
pm2 save
pm2 startup systemd -u deploy --hp /home/deploy   # run the command it prints
```

Useful later:

```bash
pm2 logs formos        # live logs (look for [formos:*] structured logs)
pm2 restart formos     # after a deploy
pm2 status
```

> **systemd alternative:** if you'd rather not use PM2, create
> `/etc/systemd/system/formos.service` running `ExecStart=/usr/bin/npm start` with
> `WorkingDirectory=/var/www/formos`, `EnvironmentFile=/var/www/formos/.env`,
> `User=deploy`, and `Restart=always`, then `systemctl enable --now formos`. Either works;
> pick one.

---

## 7. Nginx reverse proxy + TLS

Create `/etc/nginx/sites-available/formos`:

```nginx
server {
    listen 80;
    server_name formos.com.au www.formos.com.au;   # your domain(s)

    # FormOS server actions accept up to 15 MB (see next.config.ts).
    # Give headroom so uploads/signatures aren't rejected by the proxy.
    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
```

Enable it and get a certificate:

```bash
sudo ln -s /etc/nginx/sites-available/formos /etc/nginx/sites-enabled/formos
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Issue + auto-configure HTTPS (certbot edits the server block for 443 + redirect)
sudo certbot --nginx -d formos.com.au -d www.formos.com.au
```

Certbot installs a renewal timer automatically (`systemctl list-timers | grep certbot`).

> **`X-Forwarded-Proto` matters.** The app builds absolute URLs and sets a secure session
> cookie; the header above tells Next it's being served over HTTPS behind the proxy.

> **Cloudflare users:** if you keep Cloudflare in front, set SSL mode to **Full (strict)**
> and still terminate real TLS on the VPS with the certbot cert above. The old
> `cloudflare-tunnel.*` logs in the repo were for dev tunneling and aren't needed in prod.

---

## 8. Cutover

1. Keep the old Hostinger Cloud instance running until the VPS is verified.
2. Point DNS **A record** (`formos.com.au`) at the VPS public IP. Lower the TTL an hour
   beforehand so the switch propagates fast.
3. Because the DB and file storage are shared/external, **both** old and new can serve traffic
   during propagation without data divergence — there's no split-brain on the database.
4. Verify on the VPS:
   - Log in (confirms `AUTH_SECRET` carried over — sessions still valid).
   - Submit a public form with a file upload + signature (confirms 15 MB path + Drive/Dropbox).
   - Trigger a Stripe test event and confirm the webhook is received (signature-verified).
   - Generate/download a finalized PDF.
5. Once green, decommission the Hostinger Cloud plan.

### Stripe webhook note

The webhook **URL doesn't change** if the domain is the same, so Stripe keeps delivering to
the same endpoint — now served by the VPS. If you ever recreate the endpoint, update
`STRIPE_WEBHOOK_SECRET` to the new signing secret. Do **not** change the webhook route path.

---

## 9. Redeploying after this migration

```bash
cd /var/www/formos
git pull
npm ci
npm run build        # runs migrate deploy for any new committed migrations
pm2 restart formos
```

Consider a tiny `deploy.sh` with those four lines. For zero-downtime you can run two PM2
instances on different ports behind Nginx `upstream`, but for a single-tenant SaaS a
~2-second restart is usually acceptable.

---

## 10. Operational checklist

- [ ] `.env` is `chmod 600` and **not** committed (`.gitignore` already excludes it).
- [ ] `ufw` allows only 22/80/443; port 3001 stays internal.
- [ ] PM2 (or systemd) `startup` is saved so the app survives a reboot.
- [ ] Certbot renewal timer is active.
- [ ] `client_max_body_size` ≥ 15 MB in Nginx.
- [ ] Supabase IP allowlist (if enabled) includes the VPS IP.
- [ ] `AUTH_SECRET`, `DATABASE_URL`, `DIRECT_URL` copied exactly from the old environment.
- [ ] Automatic security updates: `sudo apt-get install -y unattended-upgrades`.

---

### Why the VPS is a good fit for FormOS

- The in-memory rate limiter (`lib/security/rate-limit.ts`) is per-instance. On a serverless
  host that's unreliable across cold starts; on a **single long-lived VPS process it works
  correctly** — one instance, one shared counter.
- Server Actions with a 15 MB body limit and PDF generation are CPU/memory work that runs
  comfortably on a persistent Node process rather than short-lived serverless functions.
- Stateless box (DB + files external) means backups are just "back up Supabase" — the VPS
  itself holds no irreplaceable data.
