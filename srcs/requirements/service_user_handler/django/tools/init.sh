#!/bin/sh

sed -i "s/\${DOMAIN_NAME}/$DOMAIN_NAME/g" /django_web_app/django_user_handler/settings.py

source /django_web_app/.env/bin/activate \
	&& python3 manage.py makemigrations shared_models --no-input \
    && python3 manage.py migrate --fake-initial --no-input \
	&& python3 manage.py makemigrations core --no-input \
    && python3 manage.py migrate --fake-initial --no-input \
	&& python3 manage.py collectstatic --no-input \
	&& python3 /django_web_app/utils/create_superuser.py \
	&& gunicorn --workers=9 django_user_handler.wsgi:application --bind 0.0.0.0:8000
