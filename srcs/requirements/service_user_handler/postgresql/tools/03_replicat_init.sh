#!/bin/sh

until pg_isready -U biaroun -d transcendence; do
	sleep 1
done

until pg_isready -h service_game_pong_postgresql -U biaroun -d transcendence; do
    sleep 1
done

until PGPASSWORD=azerty psql -U biaroun -d transcendence -t -c "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shared_models_tournament';" | grep -q 1; do
    sleep 1
done

until PGPASSWORD=azerty psql -h service_game_pong_postgresql -U biaroun -d transcendence -t -c "SELECT 1 FROM pg_publication WHERE pubname = 'tournament_match_pub';" | grep -q 1; do
    sleep 1
done

PGPASSWORD=azerty psql -U biaroun -d transcendence -c "
CREATE SUBSCRIPTION user_sub_tournament_data
CONNECTION 'host=service_game_pong_postgresql dbname=transcendence user=replicator password=azerty'
PUBLICATION tournament_match_pub;"
