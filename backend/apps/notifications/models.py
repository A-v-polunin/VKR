from django.db import models
from apps.accounts.models import User

class Notification(models.Model):
    NOTIFICATION_TYPES = [('request_created', 'Заявка создана'), ('new_response', 'Новый отклик'), ('participation_approved', 'Участие подтверждено'), ('participation_rejected', 'Участие отклонено'), ('new_request_nearby', 'Новая заявка рядом'), ('activity_reminder', 'Напоминание об активности'), ('request_cancelled', 'Заявка отменена'), ('request_rescheduled', 'Заявка перенесена'), ('new_message', 'Новое сообщение'), ('new_review', 'Новый отзыв')]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', verbose_name='Пользователь')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, verbose_name='Тип уведомления')
    title = models.CharField(max_length=200, verbose_name='Заголовок')
    message = models.TextField(verbose_name='Сообщение')
    is_read = models.BooleanField(default=False, verbose_name='Прочитано')
    related_request = models.ForeignKey('activities.Request', on_delete=models.CASCADE, null=True, blank=True, related_name='notifications', verbose_name='Связанная заявка')
    related_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications', verbose_name='Связанный пользователь')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        verbose_name = 'Уведомление'
        verbose_name_plural = 'Уведомления'
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', '-created_at']), models.Index(fields=['user', 'is_read'])]

    def __str__(self):
        return f'{self.user.username} - {self.title}'