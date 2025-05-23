#!/bin/sh

sed -i "s/\${DOMAIN_NAME}/$DOMAIN_NAME/g" /etc/nginx/conf.d/transcendence_fr.conf
sed -i "s/\${PORT_NUM}/$PORT_NUM/g" /etc/nginx/conf.d/transcendence_fr.conf

npm install --prefix /home/frontend
npm run build --prefix /home/frontend
nginx -g 'daemon off;'
