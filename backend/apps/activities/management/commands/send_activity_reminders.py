from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.activities.models import Request, Participation
from apps.notifications.models import Notification

class Command(BaseCommand):
    help = 'Отправляет напоминания об активности сегодня'

    def handle(self, *args, **options):
        today = timezone.now().date()
        requests_today = Request.objects.filter(status='active', date=today)
        created_count = 0
        for req in requests_today:
            Notification.objects.get_or_create(user=req.creator, notification_type='activity_reminder', related_request=req, defaults={'title': 'Напоминание: активность сегодня', 'message': f'Сегодня состоится активность "{req.title}" в {req.time}'})
            participations = Participation.objects.filter(request=req, status='approved')
            for participation in participations:
                Notification.objects.get_or_create(user=participation.user, notification_type='activity_reminder', related_request=req, defaults={'title': 'Напоминание: активность сегодня', 'message': f'Сегодня состоится активность "{req.title}" в {req.time}'})
                created_count += 1
        self.stdout.write(self.style.SUCCESS(f'Создано напоминаний: {created_count}'))