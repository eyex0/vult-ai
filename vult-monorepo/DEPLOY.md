# Deploying Vult

Vult runs as a few containers: the **web** app (static files behind nginx), the **api**, a one-shot
**migrate** job, **Postgres**, and **Caddy** in front for HTTPS. The invoice **worker** (for an SDI
intermediary feed) and the **ai** memory service are optional.

## 1. What you need

- A Linux server with Docker and the Compose plugin: 2 vCPU, 4 GB RAM, 40 GB disk is enough to start.
  Pick an EU region (Milan, Frankfurt, Paris): invoices hold personal data under GDPR.
- Two DNS records pointing to the server, for example `app.example.com` and `api.example.com`.
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

- `GET https://api.example.com/health`: the process is up. `GET /ready`: the database answers.
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
| `APP_DOMAIN`, `API_DOMAIN` | yes | Public host names; the web app is built to call `https://API_DOMAIN` |
| `POSTGRES_OWNER_PASSWORD` | yes | Owner of the tables; used only by `migrate` |
| `POSTGRES_APP_PASSWORD` | yes | `vult_app`, used by the API and worker |
| `JWT_SECRET` | yes | Signs sessions; 32+ characters. Changing it signs everyone out |
| `COOKIE_DOMAIN` | no | Parent domain shared by app and API, e.g. `.example.com` |
| `SIGNUP_ENABLED` | no | `false` closes public sign-up |
| `IMAGE_PREFIX`, `VERSION` | no | Image names when pushing to a registry |

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
   `API_ORIGIN=https://api.example.com` (port 8080). Or upload `apps/web/dist` to any static host with an
   SPA fallback to `index.html`.

## 9. Before the first paying customer

- [ ] Backups running and one restore tested.
- [ ] Uptime monitor on `/ready`, alerts on error logs.
- [ ] `SIGNUP_ENABLED` set the way you want.
- [ ] Privacy policy and data processing agreement (DPA) published; the legal pages in the app are placeholders.
- [ ] A security review of the API (tenant isolation is covered by tests, but get a second pair of eyes).
