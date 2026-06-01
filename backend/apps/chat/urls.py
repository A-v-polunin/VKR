from django.urls import path
from . import views
app_name = 'chat'
urlpatterns = [path('rooms/', views.chat_rooms_list, name='chat_rooms_list'), path('rooms/<int:pk>/', views.chat_room_detail, name='chat_room_detail'), path('rooms/<int:pk>/messages/', views.messages_list, name='messages_list'), path('rooms/<int:pk>/send/', views.send_message, name='send_message'), path('create/<int:user_id>/', views.create_chat_room, name='create_chat_room'), path('create-request/<int:request_id>/', views.create_request_chat_room, name='create_request_chat_room')]