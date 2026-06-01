from rest_framework import serializers
from .models import Notification
from apps.accounts.serializers import UserSerializer
from apps.activities.serializers import RequestSerializer

class NotificationSerializer(serializers.ModelSerializer):
    related_user = UserSerializer(read_only=True)
    related_request = RequestSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'is_read', 'related_request', 'related_user', 'created_at']
        read_only_fields = ['id', 'created_at']