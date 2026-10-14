from rest_framework import serializers
from .models import Result, ResultStatus, AttendanceStatus
from apps.examinations.serializers import GradeSerializer

class ResultSerializer(serializers.ModelSerializer):
    student_admission = serializers.CharField(source='student.admission_number', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='examination_subject.subject.name', read_only=True)
    subject_code = serializers.CharField(source='examination_subject.subject.code', read_only=True)
    class_name = serializers.CharField(source='examination_subject.class_obj.name', read_only=True)
    exam_name = serializers.CharField(source='examination_subject.examination.name', read_only=True)
    exam_id = serializers.UUIDField(source='examination_subject.examination.id', read_only=True)
    term_name = serializers.CharField(source='examination_subject.examination.term.name', read_only=True)
    academic_year_name = serializers.CharField(source='examination_subject.examination.academic_year.name', read_only=True)
    max_marks = serializers.DecimalField(source='examination_subject.max_marks', max_digits=5, decimal_places=2, read_only=True)
    pass_marks = serializers.DecimalField(source='examination_subject.pass_marks', max_digits=5, decimal_places=2, read_only=True)
    grade_name = serializers.CharField(source='grade.name', read_only=True)
    grade_point = serializers.DecimalField(source='grade.grade_point', max_digits=4, decimal_places=2, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    attendance_status_display = serializers.CharField(source='get_attendance_status_display', read_only=True)
    submitted_by_name = serializers.CharField(source='submitted_by.get_full_name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    published_by_name = serializers.CharField(source='published_by.get_full_name', read_only=True)
    reverted_by_name = serializers.CharField(source='reverted_by.get_full_name', read_only=True)

    class Meta:
        model = Result
        fields = [
            'id', 'examination_subject', 'exam_id', 'exam_name',
            'term_name', 'academic_year_name', 'class_name',
            'student', 'student_admission', 'student_name',
            'subject_name', 'subject_code',
            'marks_obtained', 'theory_marks', 'practical_marks',
            'max_marks', 'pass_marks', 'percentage', 'is_passed',
            'attendance_status', 'attendance_status_display',
            'grade', 'grade_name', 'grade_point',
            'status', 'status_display', 'remarks',
            'submitted_by_name', 'submitted_at',
            'verified_by_name', 'verified_at',
            'approved_by_name', 'approved_at',
            'published_by_name', 'published_at',
            'reverted_by_name', 'reverted_at', 'revert_reason',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'percentage', 'grade', 'is_passed', 'created_at', 'updated_at',
            'submitted_by', 'submitted_at', 'verified_by', 'verified_at',
            'approved_by', 'approved_at', 'published_by', 'published_at',
            'reverted_by', 'reverted_at'
        ]

class BulkResultItemSerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    marks_obtained = serializers.DecimalField(max_digits=5, decimal_places=2)
    theory_marks = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    practical_marks = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    attendance_status = serializers.ChoiceField(
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.PRESENT,
        required=False
    )
    remarks = serializers.CharField(required=False, allow_blank=True, default='')

class BulkResultEntrySerializer(serializers.Serializer):
    examination_subject_id = serializers.UUIDField()
    target_status = serializers.ChoiceField(
        choices=[ResultStatus.DRAFT, ResultStatus.SUBMITTED],
        default=ResultStatus.DRAFT,
        required=False
    )
    results = BulkResultItemSerializer(many=True)

class WorkflowTransitionSerializer(serializers.Serializer):
    result_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    examination_subject_id = serializers.UUIDField(required=False)
    examination_id = serializers.UUIDField(required=False)
    action = serializers.ChoiceField(choices=['submit', 'verify', 'approve', 'publish', 'revert'])
    reason = serializers.CharField(required=False, allow_blank=True, default='')
