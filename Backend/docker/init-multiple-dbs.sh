#!/bin/sh
# Runs once, on first container start (mounted into
# /docker-entrypoint-initdb.d/ — Postgres only executes these on an empty
# data directory). Creates the second database for the frontend's own
# (separate, unrelated) Prisma schema — the backend keeps POSTGRES_DB itself.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE trendgriddb_frontend;
EOSQL
