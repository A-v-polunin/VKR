from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification

@receiver(post_save, sender=Notification)
def send_notification_telegram(sender, instance, created, **kwargs):
    if created:
        from .telegram_sender import send_telegram_notification
        try:
            send_telegram_notification(user=instance.user, title=instance.title, message=instance.message, notification_type=instance.notification_type)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Ошибка отправки Telegram уведомления: {e}')