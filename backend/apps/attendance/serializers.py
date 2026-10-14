from rest_framework import serializers
from .models import Attendance, AttendanceStatus, AttendanceType
from apps.students.models import Student

class AttendanceSerializer(serializers.ModelSerializer):
    student_admission = serializers.CharField(source='student.admission_number', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    stream_name = serializers.CharField(source='stream.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'student_admission', 'student_name',
            'class_obj', 'class_name',
            'stream', 'stream_name',
            'academic_year', 'academic_year_name',
            'term', 'term_name',
            'attendance_type',
            'subject', 'subject_name', 'subject_code',
            'date', 'status', 'status_display',
            'recorded_by', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'recorded_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        student = validated_data.get('student')
        if student:
            if not validated_data.get('class_obj') and student.current_class:
                validated_data['class_obj'] = student.current_class
            if not validated_data.get('stream') and student.current_stream:
                validated_data['stream'] = student.current_stream
            if not validated_data.get('academic_year') and student.academic_year:
                validated_data['academic_year'] = student.academic_year
        return super().create(validated_data)

class BulkAttendanceItemSerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=AttendanceStatus.choices)
    notes = serializers.CharField(required=False, allow_blank=True, default='')

class BulkAttendanceSerializer(serializers.Serializer):
    date = serializers.DateField()
    class_id = serializers.UUIDField(required=False, allow_null=True)
    stream_id = serializers.UUIDField(required=False, allow_null=True)
    attendance_type = serializers.ChoiceField(choices=AttendanceType.choices, default=AttendanceType.DAILY)
    subject_id = serializers.UUIDField(required=False, allow_null=True)
    records = BulkAttendanceItemSerializer(many=True)
