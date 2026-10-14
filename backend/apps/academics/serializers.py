from rest_framework import serializers
from .models import AcademicYear, Term, Class, Stream, Subject, TeacherAssignment, AcademicCalendar, CalendarEventType

class TermSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = Term
        fields = ['id', 'academic_year', 'academic_year_name', 'name', 'start_date', 'end_date', 'is_current']

class AcademicYearSerializer(serializers.ModelSerializer):
    terms = TermSerializer(many=True, read_only=True)

    class Meta:
        model = AcademicYear
        fields = ['id', 'name', 'start_date', 'end_date', 'is_current', 'terms']

class StreamSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    student_count = serializers.IntegerField(source='students.count', read_only=True)

    class Meta:
        model = Stream
        fields = ['id', 'class_obj', 'class_name', 'name', 'capacity', 'student_count']

class ClassSerializer(serializers.ModelSerializer):
    streams = StreamSerializer(many=True, read_only=True)
    total_students = serializers.IntegerField(source='students.count', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)

    class Meta:
        model = Class
        fields = [
            'id', 'name', 'code', 'academic_stage', 'order',
            'academic_year', 'academic_year_name', 'term', 'term_name',
            'streams', 'total_students'
        ]

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'department', 'is_elective', 'credit_units', 'description']

class TeacherAssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    teacher_email = serializers.CharField(source='teacher.user.email', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    stream_name = serializers.CharField(source='stream.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)

    class Meta:
        model = TeacherAssignment
        fields = [
            'id', 'teacher', 'teacher_name', 'teacher_email',
            'subject', 'subject_name', 'subject_code',
            'class_obj', 'class_name',
            'stream', 'stream_name',
            'academic_year', 'academic_year_name',
            'term', 'term_name',
            'is_class_teacher', 'periods_per_week',
            'created_at'
        ]

class AcademicCalendarSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)

    class Meta:
        model = AcademicCalendar
        fields = [
            'id', 'academic_year', 'academic_year_name',
            'term', 'term_name',
            'title', 'event_type', 'event_type_display',
            'start_date', 'end_date', 'description',
            'is_public', 'created_at'
        ]
