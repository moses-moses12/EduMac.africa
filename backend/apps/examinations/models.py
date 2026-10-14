import uuid
from decimal import Decimal
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from apps.academics.models import AcademicYear, Term, Class, Subject

class Grade(models.Model):
    """Institutional grading scale (e.g. A+: 90-100, A: 80-89, etc.)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=10, unique=True)
    min_score = models.DecimalField(max_digits=5, decimal_places=2)
    max_score = models.DecimalField(max_digits=5, decimal_places=2)
    grade_point = models.DecimalField(max_digits=4, decimal_places=2, default=0.0)
    remark = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-min_score']

    def __str__(self):
        return f"{self.name} ({self.min_score}% - {self.max_score}%)"

class ExamType(models.TextChoices):
    CAT = 'CAT', _('Continuous Assessment Test')
    MID_TERM = 'MID_TERM', _('Mid-Term Examination')
    FINAL = 'FINAL', _('End-Term / Final Examination')
    MOCK = 'MOCK', _('Mock Examination')
    QUIZ = 'QUIZ', _('Quiz / Short Assessment')
    PRACTICAL = 'PRACTICAL', _('Practical / Oral Examination')
    NATIONAL = 'NATIONAL', _('National / Standardized Assessment')

class ExaminationType(models.Model):
    """Institutional examination category and configuration."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=30, unique=True)
    description = models.TextField(blank=True)
    default_weightage = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"

class ExaminationPeriod(models.Model):
    """Designated academic calendar window for examination cycles."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='examination_periods')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='examination_periods')
    start_date = models.DateField()
    end_date = models.DateField()
    registration_start_date = models.DateField(null=True, blank=True)
    registration_end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']
        unique_together = ('academic_year', 'term', 'name')

    def __str__(self):
        return f"{self.name} [{self.start_date} to {self.end_date}]"

class ExamStatus(models.TextChoices):
    SCHEDULED = 'SCHEDULED', _('Scheduled')
    ONGOING = 'ONGOING', _('Ongoing')
    COMPLETED = 'COMPLETED', _('Completed')
    RESULTS_PENDING = 'RESULTS_PENDING', _('Results Pending Approval')
    PUBLISHED = 'PUBLISHED', _('Published')

class Examination(models.Model):
    """Formal examination cycle (e.g. Mid-Term 1 Assessment)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    exam_type = models.CharField(max_length=30, choices=ExamType.choices, default=ExamType.MID_TERM)
    examination_type = models.ForeignKey(
        ExaminationType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='examinations'
    )
    period = models.ForeignKey(
        ExaminationPeriod,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='examinations'
    )
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='examinations')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='examinations')
    start_date = models.DateField()
    end_date = models.DateField()
    weightage = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=25, choices=ExamStatus.choices, default=ExamStatus.SCHEDULED)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['academic_year', 'term']),
            models.Index(fields=['is_published', 'start_date']),
        ]

    def __str__(self):
        return f"{self.name} - {self.term.name} ({self.academic_year.name})"

class ExaminationSubject(models.Model):
    """Specific subject assessment configuration and schedule within an examination session."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    examination = models.ForeignKey(Examination, on_delete=models.CASCADE, related_name='exam_subjects')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='exam_subjects')
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='exam_subjects', verbose_name=_('Class'))
    paper_code = models.CharField(max_length=30, blank=True, help_text="e.g. Paper 1, Paper 2")
    paper_name = models.CharField(max_length=120, blank=True, help_text="e.g. Core Calculus & Algebra")
    invigilator = models.ForeignKey(
        'staff.Teacher',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invigilated_exams'
    )
    invigilator_name = models.CharField(max_length=120, blank=True)
    theory_weight = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    practical_weight = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    max_marks = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    pass_marks = models.DecimalField(max_digits=5, decimal_places=2, default=40.00)
    exam_date = models.DateField(null=True, blank=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    room = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('examination', 'subject', 'class_obj')
        ordering = ['examination', 'subject']

    def __str__(self):
        paper_label = f" ({self.paper_code})" if self.paper_code else ""
        return f"{self.examination.name} - {self.subject.name}{paper_label} ({self.class_obj.name})"

class EligibilityStatus(models.TextChoices):
    ELIGIBLE = 'ELIGIBLE', _('Eligible')
    FLAGGED = 'FLAGGED', _('Flagged (Under Review)')
    BLOCKED = 'BLOCKED', _('Blocked / Barred')

class FeeClearanceStatus(models.TextChoices):
    CLEARED = 'CLEARED', _('Cleared')
    CONDITIONAL = 'CONDITIONAL', _('Conditional Clearance')
    BLOCKED = 'BLOCKED', _('Blocked for Fees')

class ExaminationCandidate(models.Model):
    """Official candidate registered for an examination cycle."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    examination = models.ForeignKey(Examination, on_delete=models.CASCADE, related_name='candidates')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='exam_candidacies')
    index_number = models.CharField(max_length=50, blank=True, db_index=True)
    eligibility_status = models.CharField(max_length=20, choices=EligibilityStatus.choices, default=EligibilityStatus.ELIGIBLE)
    fee_clearance = models.CharField(max_length=20, choices=FeeClearanceStatus.choices, default=FeeClearanceStatus.CLEARED)
    attendance_rate = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    notes = models.TextField(blank=True)
    registered_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('examination', 'student')
        ordering = ['index_number', 'student__admission_number']

    def __str__(self):
        full_name = self.student.user.get_full_name() if self.student.user else self.student.admission_number
        return f"{self.index_number or self.student.admission_number} - {full_name} ({self.examination.name})"
