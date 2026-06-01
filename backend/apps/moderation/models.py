from django.db import models
from apps.accounts.models import User

class Complaint(models.Model):
    COMPLAINT_TYPES = [('spam', 'Спам'), ('inappropriate_content', 'Неуместный контент'), ('fraud', 'Мошенничество'), ('harassment', 'Домогательство'), ('other', 'Другое')]
    STATUS_CHOICES = [('pending', 'Ожидает рассмотрения'), ('reviewed', 'Рассмотрена'), ('resolved', 'Решена'), ('rejected', 'Отклонена')]
    complainant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='filed_complaints', verbose_name='Жалобщик')
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints_against', null=True, blank=True, verbose_name='На кого пожаловались')
    reported_request = models.ForeignKey('activities.Request', on_delete=models.CASCADE, null=True, blank=True, related_name='complaints', verbose_name='На какую заявку пожаловались')
    complaint_type = models.CharField(max_length=50, choices=COMPLAINT_TYPES, verbose_name='Тип жалобы')
    description = models.TextField(verbose_name='Описание')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Статус')
    moderator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='moderated_complaints', verbose_name='Модератор')
    moderator_comment = models.TextField(blank=True, verbose_name='Комментарий модератора')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создана')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлена')

    class Meta:
        verbose_name = 'Жалоба'
        verbose_name_plural = 'Жалобы'
        ordering = ['-created_at']

    def __str__(self):
        return f'Жалоба от {self.complainant.username} - {self.complaint_type}'

class Ban(models.Model):
    BAN_TYPES = [('temporary', 'Временная'), ('permanent', 'Постоянная')]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bans', verbose_name='Пользователь')
    ban_type = models.CharField(max_length=20, choices=BAN_TYPES, verbose_name='Тип блокировки')
    reason = models.TextField(verbose_name='Причина')
    moderator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='issued_bans', verbose_name='Модератор')
    starts_at = models.DateTimeField(verbose_name='Начало блокировки')
    ends_at = models.DateTimeField(null=True, blank=True, verbose_name='Конец блокировки')
    is_active = models.BooleanField(default=True, verbose_name='Активна')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создана')

    class Meta:
        verbose_name = 'Блокировка'
        verbose_name_plural = 'Блокировки'
        ordering = ['-created_at']

    def __str__(self):
        return f'Блокировка {self.user.username} - {self.ban_type}'