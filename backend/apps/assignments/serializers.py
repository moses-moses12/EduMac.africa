from rest_framework import serializers
from .models import Assignment, AssignmentSubmission

class AssignmentSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    stream_name = serializers.CharField(source='stream.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    submission_count = serializers.IntegerField(source='submissions.count', read_only=True)

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'description', 'subject', 'subject_name', 'subject_code',
            'stream', 'stream_name', 'teacher', 'teacher_name',
            'due_date', 'max_marks', 'attachment_url', 'submission_count', 'created_at'
        ]
        read_only_fields = ['id', 'teacher', 'created_at']

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_admission = serializers.CharField(source='student.admission_number', read_only=True)
    max_marks = serializers.DecimalField(source='assignment.max_marks', max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'assignment', 'assignment_title',
            'student', 'student_name', 'student_admission',
            'submission_date', 'content', 'attachment_url',
            'marks_awarded', 'max_marks', 'feedback', 'status'
        ]
        read_only_fields = ['id', 'student', 'submission_date']
