from django.urls import re_path
from apps.chat import consumers
websocket_urlpatterns = [re_path('ws/chat/(?P<room_id>\\w+)/$', consumers.ChatConsumer.as_asgi())]