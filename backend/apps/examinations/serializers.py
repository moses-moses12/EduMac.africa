from rest_framework import serializers
from .models import (
    Grade,
    ExamType,
    ExamStatus,
    ExaminationType,
    ExaminationPeriod,
    Examination,
    ExaminationSubject,
    ExaminationCandidate,
    EligibilityStatus,
    FeeClearanceStatus
)

class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ['id', 'name', 'min_score', 'max_score', 'grade_point', 'remark', 'created_at']

class ExaminationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExaminationType
        fields = [
            'id', 'name', 'code', 'description',
            'default_weightage', 'is_active', 'created_at', 'updated_at'
        ]

class ExaminationPeriodSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)

    class Meta:
        model = ExaminationPeriod
        fields = [
            'id', 'name', 'academic_year', 'academic_year_name',
            'term', 'term_name', 'start_date', 'end_date',
            'registration_start_date', 'registration_end_date',
            'is_active', 'remarks', 'created_at', 'updated_at'
        ]

class ExaminationCandidateSerializer(serializers.ModelSerializer):
    student_admission = serializers.CharField(source='student.admission_number', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    class_name = serializers.CharField(source='student.current_class.name', read_only=True)
    stream_name = serializers.CharField(source='student.current_stream.name', read_only=True)
    examination_name = serializers.CharField(source='examination.name', read_only=True)

    class Meta:
        model = ExaminationCandidate
        fields = [
            'id', 'examination', 'examination_name',
            'student', 'student_admission', 'student_name',
            'class_name', 'stream_name', 'index_number',
            'eligibility_status', 'fee_clearance',
            'attendance_rate', 'notes', 'registered_at'
        ]

class ExaminationSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    examination_name = serializers.CharField(source='examination.name', read_only=True)
    invigilator_display = serializers.SerializerMethodField()
    results_count = serializers.SerializerMethodField()
    candidates_count = serializers.SerializerMethodField()

    class Meta:
        model = ExaminationSubject
        fields = [
            'id', 'examination', 'examination_name',
            'subject', 'subject_name', 'subject_code',
            'class_obj', 'class_name',
            'paper_code', 'paper_name',
            'invigilator', 'invigilator_name', 'invigilator_display',
            'theory_weight', 'practical_weight',
            'max_marks', 'pass_marks',
            'exam_date', 'start_time', 'end_time', 'room',
            'results_count', 'candidates_count', 'created_at'
        ]

    def get_invigilator_display(self, obj):
        if obj.invigilator and hasattr(obj.invigilator, 'user'):
            return obj.invigilator.user.get_full_name()
        return obj.invigilator_name or 'Unassigned'

    def get_results_count(self, obj):
        return getattr(obj, 'results_count', obj.results.count())

    def get_candidates_count(self, obj):
        return getattr(obj, 'candidates_count', obj.examination.candidates.count())

class ExaminationSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    exam_type_display = serializers.CharField(source='get_exam_type_display', read_only=True)
    examination_type_name = serializers.CharField(source='examination_type.name', read_only=True)
    period_name = serializers.CharField(source='period.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    exam_subjects = ExaminationSubjectSerializer(many=True, read_only=True)
    candidates_count = serializers.SerializerMethodField()
    subjects_count = serializers.SerializerMethodField()

    class Meta:
        model = Examination
        fields = [
            'id', 'name', 'exam_type', 'exam_type_display',
            'examination_type', 'examination_type_name',
            'period', 'period_name',
            'academic_year', 'academic_year_name',
            'term', 'term_name', 'start_date', 'end_date',
            'weightage', 'description',
            'status', 'status_display',
            'is_published', 'exam_subjects',
            'subjects_count', 'candidates_count',
            'created_at', 'updated_at'
        ]

    def get_candidates_count(self, obj):
        return obj.candidates.count()

    def get_subjects_count(self, obj):
        return obj.exam_subjects.count()
