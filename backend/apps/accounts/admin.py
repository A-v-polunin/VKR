from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Profile, Interest

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'telegram_id', 'telegram_verified', 'is_moderator', 'is_staff', 'date_joined']
    list_filter = ['is_moderator', 'is_staff', 'telegram_verified', 'phone_verified']
    fieldsets = BaseUserAdmin.fieldsets + (('Telegram', {'fields': ('telegram_id', 'telegram_verified')}), ('Дополнительно', {'fields': ('phone_verified', 'is_moderator')}))

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'city', 'rating', 'created_at']
    search_fields = ['user__username', 'city']
    list_filter = ['created_at']

@admin.register(Interest)
class InterestAdmin(admin.ModelAdmin):
    list_display = ['user', 'activity', 'level', 'created_at']
    list_filter = ['level', 'created_at']
    search_fields = ['user__username', 'activity__name']