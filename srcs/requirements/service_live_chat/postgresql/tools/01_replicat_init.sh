#!/bin/sh

until pg_isready -U biaroun -d transcendence; do
	sleep 1
done

PGPASSWORD=azerty psql -U biaroun -d transcendence -c "
CREATE USER replicator WITH PASSWORD 'azerty' REPLICATION;
GRANT USAGE ON SCHEMA public TO replicator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO replicator;"
