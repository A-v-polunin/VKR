import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import ChatRoom, Message
from apps.accounts.models import User

class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        if self.scope['user'] == AnonymousUser():
            await self.close()
            return
        room = await self.get_room()
        if not room:
            await self.close()
            return
        is_participant = await self.is_participant(room)
        if not is_participant:
            await self.close()
            return
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        if message_type == 'message':
            content = data.get('content', '')
            if content:
                message = await self.save_message(content)
                await self.channel_layer.group_send(self.room_group_name, {'type': 'chat_message', 'message': {'id': message['id'], 'sender': message['sender'], 'content': message['content'], 'created_at': message['created_at']}})
        elif message_type == 'typing':
            await self.channel_layer.group_send(self.room_group_name, {'type': 'typing_indicator', 'user': self.scope['user'].username})

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({'type': 'message', 'message': event['message']}))

    async def typing_indicator(self, event):
        if event['user'] != self.scope['user'].username:
            await self.send(text_data=json.dumps({'type': 'typing', 'user': event['user']}))

    @database_sync_to_async
    def get_room(self):
        try:
            return ChatRoom.objects.get(id=self.room_id)
        except ChatRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def is_participant(self, room):
        return room.participants.filter(id=self.scope['user'].id).exists()

    @database_sync_to_async
    def save_message(self, content):
        room = ChatRoom.objects.get(id=self.room_id)
        sender = self.scope['user']
        message = Message.objects.create(room=room, sender=sender, content=content)
        return {'id': message.id, 'sender': {'id': message.sender.id, 'username': message.sender.username}, 'content': message.content, 'created_at': message.created_at.isoformat()}