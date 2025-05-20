from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/pong/match/(?P<match_id>\d+)/$', consumers.PongConsumer.as_asgi()),
    re_path(r'^ws/pong/notifications/$', consumers.NotificationConsumer.as_asgi()),
]
