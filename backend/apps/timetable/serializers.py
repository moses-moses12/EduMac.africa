from rest_framework import serializers
from .models import Timetable

class TimetableSerializer(serializers.ModelSerializer):
    stream_name = serializers.CharField(source='stream.name', read_only=True)
    class_name = serializers.CharField(source='stream.class_obj.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    day_display = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = Timetable
        fields = [
            'id', 'stream', 'stream_name', 'class_name',
            'subject', 'subject_name', 'subject_code',
            'teacher', 'teacher_name',
            'day_of_week', 'day_display',
            'start_time', 'end_time', 'room_number'
        ]
