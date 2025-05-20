#!/bin/sh


#Check if vault_secrets container is up

until [ "docker inspect vault_secrets | jq -r '.[0].State.Running'" != "true" ] > /dev/null; do
	sleep 1
done

until docker exec vault_secrets curl --silent --fail http://172.20.0.9:8200/v1/sys/seal-status > /dev/null; do
	sleep 1
done


#Unseal key and root token recovery

docker exec -it vault_secrets vault operator init -format=json | tr -d '\r'  > ./srcs/env/.env_vault_secrets_key

UNSEAL_KEY_0=$(jq -r ".unseal_keys_b64[0]" ./srcs/env/.env_vault_secrets_key)
UNSEAL_KEY_1=$(jq -r ".unseal_keys_b64[1]" ./srcs/env/.env_vault_secrets_key)
UNSEAL_KEY_2=$(jq -r ".unseal_keys_b64[2]" ./srcs/env/.env_vault_secrets_key)
ROOT_TOKEN=$(jq -r ".root_token" ./srcs/env/.env_vault_secrets_key)


#Vault unsealing

docker exec vault_secrets vault operator unseal $UNSEAL_KEY_0 > /dev/null
docker exec vault_secrets vault operator unseal $UNSEAL_KEY_1 > /dev/null
docker exec vault_secrets vault operator unseal $UNSEAL_KEY_2 > /dev/null


#Vault secret enabling

docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault secrets enable -path=secret -version=1 kv > /dev/null


#Data extraction for vault secrets

DOMAIN_NAME=$(jq -r ".nginx.DOMAIN_NAME" ./srcs/env/.secrets.json)

USER_HANDLER_SECRET_KEY=$(jq -r ".service_user_handler_django.SECRET_KEY" ./srcs/env/.secrets.json)
USER_HANDLER_SUPER_USER_NAME=$(jq -r ".service_user_handler_django.SUPER_USER_NAME" ./srcs/env/.secrets.json)
USER_HANDLER_SUPER_USER_PASSWORD=$(jq -r ".service_user_handler_django.SUPER_USER_PASSWORD" ./srcs/env/.secrets.json)
USER_HANDLER_SUPER_USER_EMAIL=$(jq -r ".service_user_handler_django.SUPER_USER_EMAIL" ./srcs/env/.secrets.json)
USER_HANDLER_POSTGRES_HOST=$(jq -r ".service_user_handler_postgres.POSTGRES_HOST" ./srcs/env/.secrets.json)
USER_HANDLER_POSTGRES_PORT=$(jq -r ".service_user_handler_postgres.POSTGRES_PORT" ./srcs/env/.secrets.json)
USER_HANDLER_POSTGRES_DB=$(jq -r ".service_user_handler_postgres.POSTGRES_DB" ./srcs/env/.secrets.json)
USER_HANDLER_POSTGRES_USER=$(jq -r ".service_user_handler_postgres.POSTGRES_USER" ./srcs/env/.secrets.json)
USER_HANDLER_POSTGRES_PASSWORD=$(jq -r ".service_user_handler_postgres.POSTGRES_PASSWORD" ./srcs/env/.secrets.json)

GAME_PONG_SECRET_KEY=$(jq -r ".service_game_pong_django.SECRET_KEY" ./srcs/env/.secrets.json)
GAME_PONG_SUPER_USER_NAME=$(jq -r ".service_game_pong_django.SUPER_USER_NAME" ./srcs/env/.secrets.json)
GAME_PONG_SUPER_USER_PASSWORD=$(jq -r ".service_game_pong_django.SUPER_USER_PASSWORD" ./srcs/env/.secrets.json)
GAME_PONG_SUPER_USER_EMAIL=$(jq -r ".service_game_pong_django.SUPER_USER_EMAIL" ./srcs/env/.secrets.json)
GAME_PONG_POSTGRES_HOST=$(jq -r ".service_game_pong_postgres.POSTGRES_HOST" ./srcs/env/.secrets.json)
GAME_PONG_POSTGRES_PORT=$(jq -r ".service_game_pong_postgres.POSTGRES_PORT" ./srcs/env/.secrets.json)
GAME_PONG_POSTGRES_DB=$(jq -r ".service_game_pong_postgres.POSTGRES_DB" ./srcs/env/.secrets.json)
GAME_PONG_POSTGRES_USER=$(jq -r ".service_game_pong_postgres.POSTGRES_USER" ./srcs/env/.secrets.json)
GAME_PONG_POSTGRES_PASSWORD=$(jq -r ".service_game_pong_postgres.POSTGRES_PASSWORD" ./srcs/env/.secrets.json)

LIVE_CHAT_SECRET_KEY=$(jq -r ".service_live_chat_django.SECRET_KEY" ./srcs/env/.secrets.json)
LIVE_CHAT_SUPER_USER_NAME=$(jq -r ".service_live_chat_django.SUPER_USER_NAME" ./srcs/env/.secrets.json)
LIVE_CHAT_SUPER_USER_PASSWORD=$(jq -r ".service_live_chat_django.SUPER_USER_PASSWORD" ./srcs/env/.secrets.json)
LIVE_CHAT_SUPER_USER_EMAIL=$(jq -r ".service_live_chat_django.SUPER_USER_EMAIL" ./srcs/env/.secrets.json)
LIVE_CHAT_POSTGRES_HOST=$(jq -r ".service_live_chat_postgres.POSTGRES_HOST" ./srcs/env/.secrets.json)
LIVE_CHAT_POSTGRES_PORT=$(jq -r ".service_live_chat_postgres.POSTGRES_PORT" ./srcs/env/.secrets.json)
LIVE_CHAT_POSTGRES_DB=$(jq -r ".service_live_chat_postgres.POSTGRES_DB" ./srcs/env/.secrets.json)
LIVE_CHAT_POSTGRES_USER=$(jq -r ".service_live_chat_postgres.POSTGRES_USER" ./srcs/env/.secrets.json)
LIVE_CHAT_POSTGRES_PASSWORD=$(jq -r ".service_live_chat_postgres.POSTGRES_PASSWORD" ./srcs/env/.secrets.json)

VAULT_POSTGRES_DB=$(jq -r ".vault_postgres.POSTGRES_DB" ./srcs/env/.secrets.json)
VAULT_POSTGRES_USER=$(jq -r ".vault_postgres.POSTGRES_USER" ./srcs/env/.secrets.json)
VAULT_POSTGRES_PASSWORD=$(jq -r ".vault_postgres.POSTGRES_PASSWORD" ./srcs/env/.secrets.json)


#Vault secrets creation

docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/user_handler/django/domain_name domain_name=$DOMAIN_NAME > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/user_handler/django/postgres_password postgres_password=$USER_HANDLER_POSTGRES_PASSWORD > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/user_handler/django/postgres_host postgres_host=$USER_HANDLER_POSTGRES_HOST > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/user_handler/django/postgres_port postgres_port=$USER_HANDLER_POSTGRES_PORT > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/user_handler/django/postgres_user postgres_user=$USER_HANDLER_POSTGRES_USER > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/user_handler/django/postgres_database_name postgres_database_name=$USER_HANDLER_POSTGRES_DB > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/user_handler/django/django_secret_key django_secret_key=$USER_HANDLER_SECRET_KEY > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/user_handler/django/django_super_user_name django_super_user_name=$USER_HANDLER_SUPER_USER_NAME > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/user_handler/django/django_super_user_password django_super_user_password=$USER_HANDLER_SUPER_USER_PASSWORD > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/user_handler/django/django_super_user_email django_super_user_email=$USER_HANDLER_SUPER_USER_EMAIL > /dev/null

docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/user_handler/postgres/postgres_database_name postgres_database_name=$USER_HANDLER_POSTGRES_DB > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/user_handler/postgres/postgres_user postgres_user=$USER_HANDLER_POSTGRES_USER > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/user_handler/postgres/postgres_password postgres_password=$USER_HANDLER_POSTGRES_PASSWORD > /dev/null

docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/live_chat/django/domain_name domain_name=$DOMAIN_NAME > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/live_chat/django/postgres_password postgres_password=$LIVE_CHAT_POSTGRES_PASSWORD > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/live_chat/django/postgres_host postgres_host=$LIVE_CHAT_POSTGRES_HOST > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/live_chat/django/postgres_port postgres_port=$LIVE_CHAT_POSTGRES_PORT > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/live_chat/django/postgres_user postgres_user=$LIVE_CHAT_POSTGRES_USER > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/live_chat/django/postgres_database_name postgres_database_name=$LIVE_CHAT_POSTGRES_DB > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/live_chat/django/django_secret_key django_secret_key=$LIVE_CHAT_SECRET_KEY > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/live_chat/django/django_super_user_name django_super_user_name=$LIVE_CHAT_SUPER_USER_NAME > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/live_chat/django/django_super_user_password django_super_user_password=$LIVE_CHAT_SUPER_USER_PASSWORD > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/live_chat/django/django_super_user_email django_super_user_email=$LIVE_CHAT_SUPER_USER_EMAIL > /dev/null

docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/live_chat/postgres/postgres_database_name postgres_database_name=$LIVE_CHAT_POSTGRES_DB > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/live_chat/postgres/postgres_user postgres_user=$LIVE_CHAT_POSTGRES_USER > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/live_chat/postgres/postgres_password postgres_password=$LIVE_CHAT_POSTGRES_PASSWORD > /dev/null

docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/game_pong/django/domain_name domain_name=$DOMAIN_NAME > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/game_pong/django/postgres_password postgres_password=$GAME_PONG_POSTGRES_PASSWORD > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/game_pong/django/postgres_host postgres_host=$GAME_PONG_POSTGRES_HOST > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/game_pong/django/postgres_port postgres_port=$GAME_PONG_POSTGRES_PORT > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/game_pong/django/postgres_user postgres_user=$GAME_PONG_POSTGRES_USER > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/game_pong/django/postgres_database_name postgres_database_name=$GAME_PONG_POSTGRES_DB > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/game_pong/django/django_secret_key django_secret_key=$GAME_PONG_SECRET_KEY > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/game_pong/django/django_super_user_name django_super_user_name=$GAME_PONG_SUPER_USER_NAME > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/game_pong/django/django_super_user_password django_super_user_password=$GAME_PONG_SUPER_USER_PASSWORD > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/game_pong/django/django_super_user_email django_super_user_email=$GAME_PONG_SUPER_USER_EMAIL > /dev/null

docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/game_pong/postgres/postgres_database_name postgres_database_name=$GAME_PONG_POSTGRES_DB > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/game_pong/postgres/postgres_user postgres_user=$GAME_PONG_POSTGRES_USER > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault kv put secret/game_pong/postgres/postgres_password postgres_password=$GAME_PONG_POSTGRES_PASSWORD > /dev/null


#Policies

USER_HANDLER_DJANGO="user_handler_django"
USER_HANDLER_POSTGRES="user_handler_postgres"
LIVE_CHAT_DJANGO="live_chat_django"
LIVE_CHAT_POSTGRES="live_chat_postgres"
GAME_PONG_DJANGO="game_pong_django"
GAME_PONG_POSTGRES="game_pong_postgres"


#Vault policies creation

docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault policy write $USER_HANDLER_DJANGO /vault/config/vault_user_handler_django_policies.hcl > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault policy write $USER_HANDLER_POSTGRES /vault/config/vault_user_handler_postgres_policies.hcl > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault policy write $LIVE_CHAT_DJANGO /vault/config/vault_live_chat_django_policies.hcl > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault policy write $LIVE_CHAT_POSTGRES /vault/config/vault_live_chat_postgres_policies.hcl > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault policy write $GAME_PONG_DJANGO /vault/config/vault_game_pong_django_policies.hcl > /dev/null
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets vault policy write $GAME_PONG_POSTGRES /vault/config/vault_game_pong_postgres_policies.hcl > /dev/null


#Vault tokens secrets creation

docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets sh -c "vault token create -policy=$USER_HANDLER_DJANGO -ttl=20m -format=json | jq -r '.auth.client_token' > /vault/clients_tokens/user_handler_django/user_handler_django"
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets sh -c "vault token create -policy=$USER_HANDLER_POSTGRES -ttl=20m -format=json | jq -r '.auth.client_token' > /vault/clients_tokens/user_handler_postgres/user_handler_postgres"
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets sh -c "vault token create -policy=$LIVE_CHAT_DJANGO -ttl=20m -format=json | jq -r '.auth.client_token' > /vault/clients_tokens/live_chat_django/live_chat_django"
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets sh -c "vault token create -policy=$LIVE_CHAT_POSTGRES -ttl=20m -format=json | jq -r '.auth.client_token' > /vault/clients_tokens/live_chat_postgres/live_chat_postgres"
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets sh -c "vault token create -policy=$GAME_PONG_DJANGO -ttl=20m -format=json | jq -r '.auth.client_token' > /vault/clients_tokens/game_pong_django/game_pong_django"
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault_secrets sh -c "vault token create -policy=$GAME_PONG_POSTGRES -ttl=20m -format=json | jq -r '.auth.client_token' > /vault/clients_tokens/game_pong_postgres/game_pong_postgres"
