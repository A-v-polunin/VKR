from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class User(AbstractUser):
    telegram_id = models.BigIntegerField(unique=True, null=True, blank=True, verbose_name='Telegram ID')
    phone_verified = models.BooleanField(default=False, verbose_name='Телефон подтверждён')
    telegram_verified = models.BooleanField(default=False, verbose_name='Telegram подтверждён')
    is_moderator = models.BooleanField(default=False, verbose_name='Модератор')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата регистрации')

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name='Пользователь')
    photo = models.ImageField(upload_to='profiles/', null=True, blank=True, verbose_name='Фото')
    city = models.CharField(max_length=100, blank=True, verbose_name='Город')
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0, validators=[MinValueValidator(0), MaxValueValidator(5)], verbose_name='Рейтинг')
    bio = models.TextField(blank=True, verbose_name='О себе')
    home_metro_station_id = models.CharField(max_length=120, blank=True, verbose_name='Станция метро (дом)', help_text='Идентификатор станции из справочника; для фильтра «Рядом» на поиске')
    available_schedule = models.JSONField(default=dict, blank=True, help_text='Расписание доступного времени', verbose_name='Расписание')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлён')

    class Meta:
        verbose_name = 'Профиль'
        verbose_name_plural = 'Профили'

    def __str__(self):
        return f'Профиль {self.user.username}'

class Interest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interests', verbose_name='Пользователь')
    activity = models.ForeignKey('activities.Activity', on_delete=models.CASCADE, related_name='interested_users', verbose_name='Активность')
    level = models.CharField(max_length=50, choices=[('beginner', 'Начинающий'), ('intermediate', 'Средний'), ('advanced', 'Продвинутый'), ('professional', 'Профессионал')], default='beginner', verbose_name='Уровень')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Добавлен')

    class Meta:
        verbose_name = 'Интерес'
        verbose_name_plural = 'Интересы'
        unique_together = ['user', 'activity']

    def __str__(self):
        return f'{self.user.username} - {self.activity.name} ({self.level})'

class ProfileLike(models.Model):
    liker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_likes', verbose_name='Кто лайкнул')
    profile_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_likes', verbose_name='Чей профиль')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')

    class Meta:
        verbose_name = 'Лайк профиля'
        verbose_name_plural = 'Лайки профилей'
        unique_together = ['liker', 'profile_user']
        indexes = [models.Index(fields=['profile_user', '-created_at'])]

    def __str__(self):
        return f'{self.liker.username} лайкнул {self.profile_user.username}'