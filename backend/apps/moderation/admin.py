from django.contrib import admin
from .models import Complaint, Ban

@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ['complainant', 'reported_user', 'complaint_type', 'status', 'created_at']
    list_filter = ['complaint_type', 'status', 'created_at']
    search_fields = ['complainant__username', 'reported_user__username', 'description']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Ban)
class BanAdmin(admin.ModelAdmin):
    list_display = ['user', 'ban_type', 'is_active', 'starts_at', 'ends_at', 'moderator']
    list_filter = ['ban_type', 'is_active', 'starts_at']
    search_fields = ['user__username', 'reason']