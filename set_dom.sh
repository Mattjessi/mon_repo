#!/bin/bash

COMPOSE_FILE="./srcs/docker-compose.yml"
ENV_FILE="./srcs/env/.env_nginx"

if [ ! -f "$ENV_FILE" ]; then
    echo "Erreur : Le fichier $ENV_FILE n'existe pas."
    exit 1
fi

NEW_DOMAIN_NAME=\'$(hostname --short)\'

if [ -z "$NEW_DOMAIN_NAME" ]; then
    echo "Erreur : Impossible de récupérer le nom d'hôte avec 'hostname --short'."
    exit 1
fi

NEW_DOMAIN_NAME="'localhost'" #a retirer a 42

if grep -q "^DOMAIN_NAME=" "$ENV_FILE"; then
    sed -i "s/^DOMAIN_NAME=.*/DOMAIN_NAME=$NEW_DOMAIN_NAME/" "$ENV_FILE"
else
    echo "DOMAIN_NAME=$NEW_DOMAIN_NAME" >> "$ENV_FILE"
fi

sed -i "/frontend:/,/^[^[:space:]]/ {
    /VITE_DOMAIN_NAME:/ s/VITE_DOMAIN_NAME:.*/VITE_DOMAIN_NAME: $NEW_DOMAIN_NAME/
    /VITE_PORT_NUM:/ s/VITE_PORT_NUM:.*/VITE_PORT_NUM: 4343/
}" "$COMPOSE_FILE"

echo "Mise à jour réussie : DOMAIN_NAME=$NEW_DOMAIN_NAME dans $ENV_FILE"
