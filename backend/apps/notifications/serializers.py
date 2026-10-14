from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    type = serializers.CharField(source='notification_type', required=False)
    notification_type = serializers.CharField(required=False)
    recipient = serializers.UUIDField(source='user.id', read_only=True)
    recipient_email = serializers.CharField(source='user.email', read_only=True)
    recipient_name = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'type', 'notification_type',
            'type_display', 'recipient', 'recipient_email', 'recipient_name',
            'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_recipient_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email
        return "Unknown"
