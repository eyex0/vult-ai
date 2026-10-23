# Deploying Vult

Vult runs as a few containers: the **web** app (static files behind nginx), the **api**, a one-shot
**migrate** job, **Postgres**, and **Caddy** in front for HTTPS. The invoice **worker** (for an SDI
intermediary feed) and the **ai** memory service are optional.

## 1. What you need

- A Linux server with Docker and the Compose plugin: 2 vCPU, 4 GB RAM, 40 GB disk is enough to start.
  Pick an EU region (Milan, Frankfurt, Paris): invoices hold personal data under GDPR.
- One address pointing to the server, for example `app.example.com` (a DNS A record). The web app and the
  API share it: the API answers under `/api`, so there is no cross-site cookie or CORS to configure.
  **No domain yet?** Use the free `sslip.io` name of your server's IP: for IP `203.0.113.10` the address is
  `203-0-113-10.sslip.io`, and Caddy still gets a real certificate. Buy a domain before inviting customers.
- Ports 80 and 443 open. Caddy gets and renews the TLS certificates by itself.

## 2. First deployment

```sh
git clone https://github.com/eyex0/vult-ai.git && cd vult-ai/vult-monorepo
cp .env.production.example .env.production
# Fill in the domains and three secrets:
openssl rand -hex 32   # POSTGRES_OWNER_PASSWORD
openssl rand -hex 32   # POSTGRES_APP_PASSWORD
openssl rand -hex 48   # JWT_SECRET
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.production ps
```

On the first start Postgres creates the `vult_app` role (it cannot bypass row-level security), then
`migrate` applies the migrations and **refuses to finish if any table lacks row-level security**. The API
starts only after that succeeds.

Open `https://app.example.com/signup` and create the first workspace. For an invitation-only beta, set
`SIGNUP_ENABLED=false` afterwards and run `up -d` again.

## 3. Updating

```sh
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Migrations run before the new API starts. A migration that fails stops the update and the old API keeps
running.

## 4. Backups (do this on day one)

```sh
# /etc/cron.d/vult-backup: every night at 02:30, keep 14 days
30 2 * * * root cd /srv/vult-ai/vult-monorepo && docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U vult_owner -Fc vult > /srv/backups/vult-$(date +\%F).dump && find /srv/backups -name 'vult-*.dump' -mtime +14 -delete
```

Copy `/srv/backups` off the server (object storage in another region). Test a restore every month:

```sh
docker compose -f docker-compose.prod.yml exec -T postgres createdb -U vult_owner vult_restore_test
docker compose -f docker-compose.prod.yml exec -T postgres pg_restore -U vult_owner -d vult_restore_test < vult-YYYY-MM-DD.dump
```

Italian law asks you to keep invoices for 10 years: keep at least one yearly backup that long, or store the
invoice files themselves in object storage with a retention policy.

## 5. Watching it

- `GET https://app.example.com/health`: the process is up. `GET /ready`: the database answers.
  Point an uptime monitor (Better Stack, UptimeRobot) at `/ready`.
- Logs are one JSON object per line, with a request id that is also returned in the `x-request-id` header:
  `docker compose -f docker-compose.prod.yml logs -f api`.
- Errors are logged with `"level":"error"`; ship logs to a collector (Loki, Datadog, Better Stack) to alert on them.

## 6. Optional services

| Profile | Starts | Needs |
| --- | --- | --- |
| `--profile sdi` | `redis` and the invoice `worker` | `S3_*` settings: invoices delivered by your SDI intermediary into S3-compatible storage |
| `--profile ai` | `qdrant` and the `ai` service | `OPENAI_API_KEY`, `AI_SERVICE_TOKEN` |

Uploading invoices (XML, `.p7m` or the Agenzia delle Entrate ZIP) and bank statements from the Match page
works without either profile.

## 7. Settings

| Variable | Required | What it does |
| --- | --- | --- |
| `APP_DOMAIN` | yes | Public address; the web app is served at `/` and the API at `/api` |
| `CONTACT_EMAIL`, `LEGAL_ENTITY` | yes | Shown on the website and in the privacy policy and terms |
| `LEADS_WEBHOOK_URL` | no | Each early-access request is also posted here (Slack, Make, Zapier); export them with `pnpm --filter @vult/api-server leads` |
| `POSTGRES_OWNER_PASSWORD` | yes | Owner of the tables; used only by `migrate` |
| `POSTGRES_APP_PASSWORD` | yes | `vult_app`, used by the API and worker |
| `JWT_SECRET` | yes | Signs sessions; 32+ characters. Changing it signs everyone out |
| `SIGNUP_ENABLED` | no | `false` closes public sign-up |
| `IMAGE_PREFIX`, `VERSION` | no | Image names when pushing to a registry |
| `CADDY_GLOBAL_OPTIONS` | no | `local_certs` for a staging box without public DNS (Caddy's own certificates) |

The API checks its settings at startup and exits with a clear message if one is missing or still the example
value. Compose refuses to start when a required variable is empty.

## 8. Without a server: managed services

The same images run on managed platforms (Render, Fly.io, Railway, Scaleway, Google Cloud Run):

1. Create a managed Postgres 16 in the EU. As its admin user, create the app role:
   `CREATE ROLE vult_app LOGIN PASSWORD '…' NOSUPERUSER NOBYPASSRLS;`
2. Run the `migrate` image once with `DATABASE_URL` set to the admin user (on every release, before the API).
3. Run the `api` image with `DATABASE_URL` for `vult_app`, `JWT_SECRET`, `CORS_ORIGINS=https://app.example.com`,
   `NODE_ENV=production`, `TRUST_PROXY_HOPS=1`. Health check: `/ready`.
4. Build the `web` image with `--build-arg VITE_API_URL=https://api.example.com` and run it with
   `API_ORIGIN=https://api.example.com` (port 8080). On a managed platform the API usually gets its own
   address: keep both under the same parent domain, because the session cookie is SameSite=Lax. Or upload `apps/web/dist` to any static host with an
   SPA fallback to `index.html`.

## 9. Vercel + Render + Neon (no server)

- **Neon** (Postgres, region Frankfurt). In the SQL editor, before the first deploy:
  `CREATE ROLE vult_app LOGIN PASSWORD '…' NOSUPERUSER NOBYPASSRLS;`
  Use the direct (not pooled) connection strings.
- **Render**, web service from this repository: root directory `vult-monorepo`, runtime Docker (the
  Dockerfile's last stage is the API). Pre-deploy command `npm run migrate`, health check path `/ready`.
  Environment: `NODE_ENV=production`, `DATABASE_URL` (as `vult_app`), `MIGRATION_DATABASE_URL` (as the Neon
  owner), `JWT_SECRET`, `CORS_ORIGINS=https://<your-app>.vercel.app`, `TRUST_PROXY_HOPS=2`. The API listens
  on Render's `PORT`.
- **Vercel**, project from this repository: root directory `vult-monorepo`; `vercel.json` sets the build.
  Environment: `VITE_API_URL=https://<your-app>.vercel.app`, `VITE_CONTACT_EMAIL`, `VITE_LEGAL_ENTITY`.
  If the Render service is not called `vult-api`, edit the `/api` rewrite in `vercel.json`: Vercel forwards
  `/api/*` to Render, so the browser sees one address and the session cookie works.

## 10. Before the first paying customer

- [ ] Backups running and one restore tested.
- [ ] Uptime monitor on `/ready`, alerts on error logs.
- [ ] `SIGNUP_ENABLED` set the way you want.
- [ ] Privacy policy and data processing agreement (DPA) published; the legal pages in the app are placeholders.
- [ ] A security review of the API (tenant isolation is covered by tests, but get a second pair of eyes).
