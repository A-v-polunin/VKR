from django.db import models
from apps.accounts.models import User

class ChatRoom(models.Model):
    participants = models.ManyToManyField(User, related_name='chat_rooms', verbose_name='Участники')
    request = models.ForeignKey('activities.Request', on_delete=models.SET_NULL, null=True, blank=True, related_name='chat_rooms', verbose_name='Связанная заявка')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создана')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлена')

    class Meta:
        verbose_name = 'Комната чата'
        verbose_name_plural = 'Комнаты чата'
        ordering = ['-updated_at']

    def __str__(self):
        participants_list = ', '.join([p.username for p in self.participants.all()[:2]])
        return f'Чат: {participants_list}'

class Message(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages', verbose_name='Комната')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages', verbose_name='Отправитель')
    content = models.TextField(verbose_name='Содержание')
    is_read = models.BooleanField(default=False, verbose_name='Прочитано')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        verbose_name = 'Сообщение'
        verbose_name_plural = 'Сообщения'
        ordering = ['created_at']
        indexes = [models.Index(fields=['room', '-created_at'])]

    def __str__(self):
        return f'{self.sender.username}: {self.content[:50]}'