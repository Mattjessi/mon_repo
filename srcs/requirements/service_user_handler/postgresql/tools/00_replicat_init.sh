#!/bin/sh
set -e

VAULT_TOKEN=$(cat /etc/postgresql/user_handler_postgres/user_handler_postgres)

PG_NAME=$(curl -q --silent --header "X-Vault-Token: $VAULT_TOKEN" http://vault:8200/v1/secret/user_handler/postgres/postgres_database_name | jq -r ".data.postgres_database_name")
PG_USER=$(curl -q --silent --header "X-Vault-Token: $VAULT_TOKEN" http://vault:8200/v1/secret/user_handler/postgres/postgres_user | jq -r ".data.postgres_user")
PG_PASSWORD=$(curl -q --silent --header "X-Vault-Token: $VAULT_TOKEN" http://vault:8200/v1/secret/user_handler/postgres/postgres_password | jq -r ".data.postgres_password")

# Démarrer PostgreSQL temporairement
pg_ctl -D /var/lib/postgresql/data -o "-c listen_addresses='localhost'" -w start

psql -U postgres -c "CREATE ROLE $PG_USER WITH SUPERUSER CREATEDB CREATEROLE REPLICATION BYPASSRLS LOGIN PASSWORD '$PG_PASSWORD';"
psql -U postgres -c "CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD '$PG_PASSWORD';"
psql -U postgres -c "CREATE DATABASE $PG_NAME OWNER $PG_USER;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $PG_NAME TO $PG_USER;"

# Attendre que la DB soit prête
until pg_isready -U "$PG_USER" -d "$PG_NAME"; do
  sleep 1
done

# Accorder des privilèges en tant que $PG_USER
PGPASSWORD=$PG_PASSWORD psql -U "$PG_USER" -d "$PG_NAME" -c "GRANT USAGE ON SCHEMA public TO replicator;"
PGPASSWORD=$PG_PASSWORD psql -U "$PG_USER" -d "$PG_NAME" -c "GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;"
PGPASSWORD=$PG_PASSWORD psql -U "$PG_USER" -d "$PG_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO replicator;"

# Arrêter PostgreSQL temporaire
pg_ctl -D /var/lib/postgresql/data stop
