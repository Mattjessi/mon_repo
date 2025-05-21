#!/bin/sh
set -e

# Démarrer PostgreSQL temporairement
pg_ctl -D /var/lib/postgresql/data -o "-c listen_addresses='localhost'" -w start

# Connexion en tant que postgres pour créer les rôles et la base
psql -U postgres <<EOF
CREATE ROLE biaroun WITH SUPERUSER CREATEDB CREATEROLE REPLICATION BYPASSRLS LOGIN PASSWORD 'azerty';
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'azerty';
CREATE DATABASE transcendence OWNER biaroun;
GRANT ALL PRIVILEGES ON DATABASE transcendence TO biaroun;
EOF

# Ensuite, en tant que biaroun, accorder les privilèges au rôle replicator
psql -U biaroun -d transcendence <<EOF
GRANT USAGE ON SCHEMA public TO replicator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO replicator;
EOF

# Arrêter PostgreSQL temporaire
pg_ctl -D /var/lib/postgresql/data stop
