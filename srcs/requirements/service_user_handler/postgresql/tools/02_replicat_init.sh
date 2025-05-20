#!/bin/sh

until pg_isready -U biaroun -d transcendence; do
	sleep 1
done

for table in auth_user shared_models_player shared_models_block shared_models_friendship; do
    until PGPASSWORD=azerty psql -U biaroun -d transcendence -t -c "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table';" | grep -q 1; do
        sleep 1
    done
done

PGPASSWORD=azerty psql -U biaroun -d transcendence -c "
CREATE PUBLICATION auth_user_pub FOR TABLE auth_user;
CREATE PUBLICATION shared_models_pub FOR TABLE shared_models_player, shared_models_block, shared_models_friendship;"
