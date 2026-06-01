import secrets
import hashlib
from datetime import datetime, timedelta
from django.core.cache import cache
from django.contrib.auth import login
from .models import User

def generate_auth_code(telegram_id: int) -> str:
    code = secrets.token_urlsafe(16)
    cache_key = f'telegram_auth_{code}'
    cache.set(cache_key, telegram_id, timeout=600)
    return code

def verify_auth_code(code: str) -> int:
    cache_key = f'telegram_auth_{code}'
    telegram_id = cache.get(cache_key)
    if telegram_id:
        cache.delete(cache_key)
    return telegram_id

def get_or_create_telegram_user(telegram_id: int, username: str=None, first_name: str=None, last_name: str=None) -> User:
    try:
        user = User.objects.get(telegram_id=telegram_id)
        if username and user.username != username:
            user.username = username
            user.save()
    except User.DoesNotExist:
        username = username or f'telegram_{telegram_id}'
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f'{base_username}_{counter}'
            counter += 1
        user = User.objects.create_user(username=username, telegram_id=telegram_id, telegram_verified=True, first_name=first_name or '', last_name=last_name or '')
    return user