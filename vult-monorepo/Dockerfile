# syntax=docker/dockerfile:1.7
# One Dockerfile, several images:  docker build --target api|worker|migrate|web .  (no --target builds the API)
# Behind a TLS-inspecting proxy, pass its CA:  --secret id=extra_ca,src=/path/to/ca.crt
ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS base
# OpenSSL (for Prisma) and CA certificates; skipped when the base image already has them.
RUN --mount=type=secret,id=extra_ca,required=false \
    if ! { command -v openssl && [ -f /etc/ssl/certs/ca-certificates.crt ]; } >/dev/null 2>&1; then \
      apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*; \
    fi \
 && if [ -f /run/secrets/extra_ca ]; then cp /run/secrets/extra_ca /usr/local/share/ca-certificates/extra.crt && update-ca-certificates; fi
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt \
    PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN npm install -g pnpm@9.15.4 && npm cache clean --force
WORKDIR /repo

# Dependencies first (cached until the lockfile changes), then sources and the build.
FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch --frozen-lockfile
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --offline --frozen-lockfile
# The web app talks to this API; it is baked in at build time.
ARG VITE_API_URL=""
ARG VITE_CONTACT_EMAIL=""
ARG VITE_LEGAL_ENTITY=""
ENV VITE_API_URL=$VITE_API_URL VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL VITE_LEGAL_ENTITY=$VITE_LEGAL_ENTITY
RUN pnpm turbo run build --ui=stream --filter=@vult/api-server... --filter=@vult/ingestion-worker... --filter=@vult/web
# Self-contained production installs for the Node services.
RUN pnpm deploy --filter=@vult/api-server --prod /out/api \
 && pnpm deploy --filter=@vult/ingestion-worker --prod /out/worker

FROM ${NODE_IMAGE} AS runtime
RUN --mount=type=secret,id=extra_ca,required=false \
    if ! { command -v openssl && [ -f /etc/ssl/certs/ca-certificates.crt ]; } >/dev/null 2>&1; then \
      apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*; \
    fi \
 && if [ -f /run/secrets/extra_ca ]; then cp /run/secrets/extra_ca /usr/local/share/ca-certificates/extra.crt && update-ca-certificates; fi
ENV NODE_ENV=production
WORKDIR /app
# The services handle SIGTERM themselves (graceful shutdown), so node runs as PID 1 without an init.
USER node

FROM runtime AS worker
COPY --from=build --chown=node:node /out/worker /app
CMD ["node", "dist/index.js"]

# One-shot job: apply migrations, then refuse to finish if any table lacks row-level security.
FROM build AS migrate
WORKDIR /repo/packages/database
CMD ["sh", "-c", "pnpm db:migrate && pnpm db:check-rls"]

FROM nginxinc/nginx-unprivileged:1.27-alpine AS web
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
ENV API_ORIGIN=""
EXPOSE 8080

# Last on purpose: platforms that build the final stage without a --target (Render) get the API.
FROM runtime AS api
COPY --from=build --chown=node:node /out/api /app
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "dist/index.js"]
