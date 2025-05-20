#!/bin/sh

until pg_isready -U biaroun -d transcendence; do
	sleep 1
done

until pg_isready -h service_user_handler_postgresql -U biaroun -d transcendence; do
	sleep 1
done

until pg_isready -h service_game_pong_postgresql -U biaroun -d transcendence; do
	sleep 1
done

for table in auth_user shared_models_tournament shared_models_player shared_models_block shared_models_friendship; do
    until PGPASSWORD=azerty psql -U biaroun -d transcendence -t -c "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table';" | grep -q 1; do
        sleep 1
    done
done

until PGPASSWORD=azerty psql -h service_user_handler_postgresql -U biaroun -d transcendence -t -c "SELECT 1 FROM pg_publication WHERE pubname = 'auth_user_pub';" | grep -q 1; do
    sleep 1
done

until PGPASSWORD=azerty psql -h service_user_handler_postgresql -U biaroun -d transcendence -t -c "SELECT 1 FROM pg_publication WHERE pubname = 'shared_models_pub';" | grep -q 1; do
    sleep 1
done

until PGPASSWORD=azerty psql -h service_game_pong_postgresql -U biaroun -d transcendence -t -c "SELECT 1 FROM pg_publication WHERE pubname = 'tournament_match_pub';" | grep -q 1; do
    sleep 1
done

PGPASSWORD=azerty psql -U biaroun -d transcendence -c "
CREATE SUBSCRIPTION chat_sub_auth_user
CONNECTION 'host=service_user_handler_postgresql dbname=transcendence user=replicator password=azerty'
PUBLICATION auth_user_pub;"

PGPASSWORD=azerty psql -U biaroun -d transcendence -c "
CREATE SUBSCRIPTION chat_sub_tournament_data
CONNECTION 'host=service_game_pong_postgresql dbname=transcendence user=replicator password=azerty'
PUBLICATION tournament_match_pub;"

PGPASSWORD=azerty psql -U biaroun -d transcendence -c "
CREATE SUBSCRIPTION chat_sub_player_data
CONNECTION 'host=service_user_handler_postgresql dbname=transcendence user=replicator password=azerty'
PUBLICATION shared_models_pub;"
