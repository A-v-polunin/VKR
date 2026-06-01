from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.accounts.models import User

class Category(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name='Название')
    slug = models.SlugField(unique=True, verbose_name='URL')
    icon = models.CharField(max_length=50, blank=True, verbose_name='Иконка')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создана')

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['name']

    def __str__(self):
        return self.name

class Activity(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='Название')
    slug = models.SlugField(unique=True, verbose_name='URL')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='activities', verbose_name='Категория')
    description = models.TextField(blank=True, verbose_name='Описание')
    icon = models.CharField(max_length=50, blank=True, verbose_name='Иконка')
    is_active = models.BooleanField(default=True, verbose_name='Активна')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создана')

    class Meta:
        verbose_name = 'Активность'
        verbose_name_plural = 'Активности'
        ordering = ['name']

    def __str__(self):
        return self.name

class Request(models.Model):
    REQUEST_TYPE_CHOICES = [('sport', 'Спорт'), ('entertainment', 'Развлечения')]
    FORMAT_CHOICES = [('partner', 'Партнёр'), ('company', 'Компания'), ('group', 'Группа')]
    VISIBILITY_CHOICES = [('public', 'Публичная'), ('link', 'Только по ссылке')]
    STATUS_CHOICES = [('active', 'Активна'), ('pending', 'Ожидает подтверждения'), ('filled', 'Набрана'), ('completed', 'Завершена'), ('cancelled', 'Отменена')]
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_requests', verbose_name='Создатель')
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES, verbose_name='Тип')
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='requests', verbose_name='Активность')
    format = models.CharField(max_length=20, choices=FORMAT_CHOICES, verbose_name='Формат')
    date = models.DateField(verbose_name='Дата')
    time = models.TimeField(verbose_name='Время')
    date_end = models.DateField(null=True, blank=True, verbose_name='Дата окончания (для диапазона)')
    time_end = models.TimeField(null=True, blank=True, verbose_name='Время окончания')
    location_name = models.CharField(max_length=200, verbose_name='Название места')
    latitude = models.DecimalField(max_digits=10, decimal_places=6, verbose_name='Широта')
    longitude = models.DecimalField(max_digits=10, decimal_places=6, verbose_name='Долгота')
    address = models.TextField(blank=True, verbose_name='Адрес')
    metro_stations = models.JSONField(default=list, blank=True, verbose_name='Станции метро')
    level = models.CharField(max_length=50, choices=[('beginner', 'Начинающий'), ('intermediate', 'Средний'), ('advanced', 'Продвинутый'), ('professional', 'Профессионал'), ('any', 'Любой')], default='any', verbose_name='Уровень')
    max_participants = models.PositiveIntegerField(validators=[MinValueValidator(1)], verbose_name='Максимум участников')
    current_participants = models.PositiveIntegerField(default=0, verbose_name='Текущее количество участников')
    title = models.CharField(max_length=200, verbose_name='Заголовок')
    description = models.TextField(verbose_name='Описание')
    requirements = models.TextField(blank=True, verbose_name='Требования')
    photos = models.JSONField(default=list, blank=True, help_text='Список URL фотографий', verbose_name='Фото')
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='public', verbose_name='Видимость')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='Статус')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создана')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлена')

    class Meta:
        verbose_name = 'Заявка'
        verbose_name_plural = 'Заявки'
        ordering = ['-created_at']
        indexes = [models.Index(fields=['-created_at']), models.Index(fields=['status', 'request_type']), models.Index(fields=['latitude', 'longitude'])]

    def __str__(self):
        return f'{self.title} - {self.creator.username}'

class Participation(models.Model):
    STATUS_CHOICES = [('pending', 'Ожидает подтверждения'), ('approved', 'Подтверждён'), ('rejected', 'Отклонён'), ('cancelled', 'Отменён'), ('excluded', 'Исключён')]
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='participations', verbose_name='Заявка')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='participations', verbose_name='Участник')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Статус')
    message = models.TextField(blank=True, verbose_name='Сообщение при отклике')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлён')

    class Meta:
        verbose_name = 'Участие'
        verbose_name_plural = 'Участия'
        unique_together = ['request', 'user']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} - {self.request.title} ({self.status})'

class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites', verbose_name='Пользователь')
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='favorited_by', verbose_name='Заявка')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Добавлено')

    class Meta:
        verbose_name = 'Избранное'
        verbose_name_plural = 'Избранное'
        unique_together = ['user', 'request']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} - {self.request.title}'

class Review(models.Model):
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='reviews', verbose_name='Заявка')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_reviews', verbose_name='Автор отзыва')
    reviewed_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_reviews', verbose_name='Оценённый пользователь')
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], verbose_name='Оценка')
    comment = models.TextField(blank=True, verbose_name='Комментарий')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')

    class Meta:
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'
        unique_together = ['request', 'reviewer', 'reviewed_user']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.reviewer.username} -> {self.reviewed_user.username} ({self.rating}/5)'