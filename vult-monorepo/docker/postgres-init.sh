#!/bin/sh
# First start only: the role the API and worker use. It owns nothing and cannot bypass row-level security;
# the migration grants it access to the tables.
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
CREATE ROLE vult_app LOGIN PASSWORD '${POSTGRES_APP_PASSWORD}' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
GRANT CONNECT ON DATABASE "${POSTGRES_DB}" TO vult_app;
SQL
