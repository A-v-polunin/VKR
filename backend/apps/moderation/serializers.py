from rest_framework import serializers
from django.utils import timezone
from .models import Complaint, Ban
from apps.accounts.serializers import UserSerializer
from apps.activities.serializers import RequestSerializer

class ComplaintSerializer(serializers.ModelSerializer):
    complainant = UserSerializer(read_only=True)
    reported_user = UserSerializer(read_only=True)
    reported_request = RequestSerializer(read_only=True)
    moderator = UserSerializer(read_only=True)

    class Meta:
        model = Complaint
        fields = ['id', 'complainant', 'reported_user', 'reported_request', 'complaint_type', 'description', 'status', 'moderator', 'moderator_comment', 'created_at', 'updated_at']
        read_only_fields = ['id', 'complainant', 'moderator', 'created_at', 'updated_at']

class BanSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    moderator = UserSerializer(read_only=True)
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = Ban
        fields = ['id', 'user', 'ban_type', 'reason', 'moderator', 'starts_at', 'ends_at', 'is_active', 'created_at']
        read_only_fields = ['id', 'moderator', 'created_at']

    def get_is_active(self, obj):
        if not obj.is_active:
            return False
        if obj.ends_at and obj.ends_at <= timezone.now():
            return False
        return True