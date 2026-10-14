from rest_framework import serializers
from .models import Announcement

class AnnouncementSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.CharField(source='posted_by.get_full_name', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'target_roles',
            'priority', 'priority_display', 'posted_by', 'posted_by_name',
            'valid_until', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'posted_by', 'created_at']
