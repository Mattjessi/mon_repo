#!/bin/sh

sed -i "s/\${DOMAIN_NAME}/$DOMAIN_NAME/g" /etc/nginx/conf.d/transcendence_fr.conf

nginx -g 'daemon off;'
