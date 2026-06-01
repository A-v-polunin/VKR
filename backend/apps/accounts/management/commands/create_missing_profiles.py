from django.core.management.base import BaseCommand
from apps.accounts.models import User, Profile

class Command(BaseCommand):
    help = 'Создаёт профили для пользователей, у которых их нет'

    def handle(self, *args, **options):
        users_without_profile = User.objects.filter(profile__isnull=True)
        count = users_without_profile.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS('Все пользователи имеют профили'))
            return
        created = 0
        from decimal import Decimal
        for user in users_without_profile:
            Profile.objects.create(user=user, rating=Decimal('0.00'))
            created += 1
            self.stdout.write(self.style.SUCCESS(f'Создан профиль для {user.username}'))
        self.stdout.write(self.style.SUCCESS(f'\nСоздано профилей: {created}'))