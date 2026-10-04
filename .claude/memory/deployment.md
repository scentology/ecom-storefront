# Production deployment (set up 2026-09-30)

Repos live in the **`scentology` GitHub org** (moved from `mhshajib` on 2026-09-30): `scentology/ecom-api`,
`scentology/ecom-admin`, `scentology/ecom-storefront`. The Go module path is still `github.com/mhshajib/ecom-api`
(internal import name only; left as is on purpose).

Push to `main` → Drone (homelab, **ci.octabits.org**, server + runner on w1) runs `.drone.yml` → deploys over SSH as
user `ci` to the prod host **139.162.8.118** (Ubuntu 24.04, same box as muniif.org). Same pattern as muniif-api / muniif-org.
Every push to `main` deploys, so push only what is ready.

| Repo | Domain | On the host | Runs as |
|---|---|---|---|
| ecom-api | api.scentology.bd | `/var/www/api.scentology.bd` (binary + config.yml) | supervisor `scentology_api` (127.0.0.1:8091) + `scentology_scheduler` |
| ecom-storefront | scentology.bd (www → apex) | `/var/www/scentology.bd` (`.output/` + `.env`) | supervisor `scentology_storefront` (node 22, 127.0.0.1:8092, `node --env-file=.env`) |
| ecom-admin | control.scentology.bd | `/var/www/control.scentology.bd` (static SPA from `nuxt generate`) | nginx only |

- **Config lives in Consul** (w2, `http://192.168.68.117:8500`, UI consul.octabits.org), never in git:
  `apps/ecom-api/prod/config.yml`, `apps/ecom-admin/prod/.env`, `apps/ecom-storefront/prod/.env`. Edit there, then re-run the build.
  Deploy SSH key is shared with muniif: `apps/muniif-org/prod/deploy_key`. `ci` may only `sudo supervisorctl`.
- **Mongo 8.0.21 + Redis** are local on the host, shared with muniif: db `scentology`, redis db 5/6, prefix `scentology_`.
  Passwords contain `#`, keep them quoted in YAML. Local docker Mongo is 8.3, so 8.0-only errors don't show locally.
- **Storage**: AWS S3 bucket `scentology` (ap-southeast-1), public url `https://scentology.s3.ap-southeast-1.amazonaws.com`.
  Uploads use the `public-read` ACL: the bucket needs ACLs enabled and Block Public Access off.
- **Email**: Orb (`email.provider: orb`, org "Scentology BD"), from `system@scentology.bd`. SMS is off
  (`notifications.sms: false`, no SMS account), so customer sign-in and all notifications are by email.
- **Data**: prod started from the committed snapshot (`seed-data/`), so staff logins are the local ones (same passwords).
- nginx vhosts `/etc/nginx/sites-available/{scentology.bd,control.scentology.bd,api.scentology.bd}.conf`; certs by certbot
  webroot `/var/www/acme` (Cloudflare proxies the domains). Logs: `/var/log/scentology_*.log`, `/var/log/nginx/*scentology*`.
- API deploy runs `migration up` (idempotent) and health-checks `GET /storefront/info`. `GET /` reports the deployed commit.
- Build results: Drone UI, or read-only from its sqlite on w1 (`/data/drone/database.sqlite`, e.g. via a `keinos/sqlite3` container).
- The auto-mode classifier blocks direct writes to the prod database from Claude; hand the user the command instead.

## Open on prod (as of 2026-09-30)
- Settings → Payments → "Public API address" still `http://localhost:8080` (from the snapshot): set it to
  `https://api.scentology.bd`. Every courier webhook and payment callback URL is built from it.
- Image links rewritten to S3 on 2026-10-05 (`scripts/rewrite-image-links.js`, 212 docs). A new snapshot restore on prod needs it again.
- No real Orb send verified yet (use Notifications → Send test). SMS account not set up.
