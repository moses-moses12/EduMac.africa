import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from apps.examinations.models import ExaminationSubject, Grade
from apps.students.models import Student

class ResultStatus(models.TextChoices):
    DRAFT = 'DRAFT', _('Draft')
    SUBMITTED = 'SUBMITTED', _('Submitted')
    VERIFIED = 'VERIFIED', _('Verified')
    APPROVED = 'APPROVED', _('Approved')
    PUBLISHED = 'PUBLISHED', _('Published')

class AttendanceStatus(models.TextChoices):
    PRESENT = 'PRESENT', _('Present')
    ABSENT = 'ABSENT', _('Absent')
    EXCUSED = 'EXCUSED', _('Excused')
    EXPELLED = 'EXPELLED', _('Expelled / Disqualified')

class Result(models.Model):
    """Assessment score and grade earned by a student in an examination subject."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    examination_subject = models.ForeignKey(ExaminationSubject, on_delete=models.CASCADE, related_name='results')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='results')
    
    # Marks Breakdown
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2)
    theory_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    practical_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    is_passed = models.BooleanField(default=False)
    attendance_status = models.CharField(
        max_length=20,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.PRESENT
    )
    grade = models.ForeignKey(Grade, on_delete=models.SET_NULL, null=True, blank=True, related_name='results')
    status = models.CharField(max_length=20, choices=ResultStatus.choices, default=ResultStatus.DRAFT, db_index=True)
    remarks = models.CharField(max_length=255, blank=True)

    # Lifecycle workflow audit trail
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='results_submitted'
    )
    submitted_at = models.DateTimeField(null=True, blank=True)

    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='results_verified'
    )
    verified_at = models.DateTimeField(null=True, blank=True)

    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='results_approved'
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='results_published'
    )
    published_at = models.DateTimeField(null=True, blank=True)

    # Reversion audit trail
    reverted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='results_reverted'
    )
    reverted_at = models.DateTimeField(null=True, blank=True)
    revert_reason = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('examination_subject', 'student')
        ordering = ['examination_subject', '-marks_obtained']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['student', 'status']),
        ]

    def clean(self):
        super().clean()
        if hasattr(self, 'examination_subject') and self.examination_subject:
            max_marks = self.examination_subject.max_marks
            if self.attendance_status == AttendanceStatus.ABSENT:
                self.marks_obtained = Decimal('0.00')
                if not self.remarks:
                    self.remarks = _('Absent from examination')
                return

            if self.marks_obtained is not None:
                if self.marks_obtained < Decimal('0.00'):
                    raise ValidationError({'marks_obtained': _('Marks obtained cannot be negative.')})
                if self.marks_obtained > max_marks:
                    raise ValidationError({'marks_obtained': _(f'Marks obtained ({self.marks_obtained}) cannot exceed maximum allowed marks ({max_marks}).')})

    def calculate_grade(self):
        """Backend single source of truth for grading, percentage, and pass/fail determination."""
        if hasattr(self, 'examination_subject') and self.examination_subject:
            max_marks = self.examination_subject.max_marks or Decimal('100.00')
            pass_marks = self.examination_subject.pass_marks or Decimal('40.00')

            # Calculate total marks from components if provided and marks_obtained wasn't explicitly entered
            if self.theory_marks is not None and self.practical_marks is not None:
                self.marks_obtained = self.theory_marks + self.practical_marks

            if self.attendance_status == AttendanceStatus.ABSENT:
                self.marks_obtained = Decimal('0.00')
                self.percentage = Decimal('0.00')
                self.is_passed = False
                # Assign lowest grade or leave remarks
                lowest_grade = Grade.objects.order_by('min_score').first()
                if lowest_grade:
                    self.grade = lowest_grade
                if not self.remarks:
                    self.remarks = _('Absent')
                return

            if self.marks_obtained is not None:
                if max_marks > Decimal('0.00'):
                    self.percentage = round((Decimal(str(self.marks_obtained)) / Decimal(str(max_marks))) * Decimal('100.0'), 2)
                else:
                    self.percentage = Decimal('0.00')

                self.is_passed = (self.marks_obtained >= pass_marks)

                # Lookup matching institutional Grade rule
                matching_grade = Grade.objects.filter(
                    min_score__lte=self.percentage,
                    max_score__gte=self.percentage
                ).order_by('-min_score').first()

                if matching_grade:
                    self.grade = matching_grade
                    if not self.remarks:
                        self.remarks = matching_grade.remark

    def save(self, *args, **kwargs):
        self.clean()
        self.calculate_grade()
        super().save(*args, **kwargs)

    def transition_to(self, new_status, user, reason=None):
        """
        Execute strict lifecycle state transition:
        DRAFT -> SUBMITTED -> VERIFIED -> APPROVED -> PUBLISHED
        with user attribution and audit trail.
        """
        now = timezone.now()
        
        # Valid state flow checks
        valid_transitions = {
            ResultStatus.DRAFT: [ResultStatus.SUBMITTED],
            ResultStatus.SUBMITTED: [ResultStatus.VERIFIED, ResultStatus.DRAFT],
            ResultStatus.VERIFIED: [ResultStatus.APPROVED, ResultStatus.DRAFT],
            ResultStatus.APPROVED: [ResultStatus.PUBLISHED, ResultStatus.DRAFT],
            ResultStatus.PUBLISHED: [ResultStatus.DRAFT], # Only executive can revert published results
        }

        if new_status not in valid_transitions.get(self.status, []):
            raise ValidationError(f"Invalid transition from {self.status} to {new_status}.")

        if new_status == ResultStatus.SUBMITTED:
            self.status = ResultStatus.SUBMITTED
            self.submitted_by = user
            self.submitted_at = now
        elif new_status == ResultStatus.VERIFIED:
            self.status = ResultStatus.VERIFIED
            self.verified_by = user
            self.verified_at = now
        elif new_status == ResultStatus.APPROVED:
            self.status = ResultStatus.APPROVED
            self.approved_by = user
            self.approved_at = now
        elif new_status == ResultStatus.PUBLISHED:
            self.status = ResultStatus.PUBLISHED
            self.published_by = user
            self.published_at = now
        elif new_status == ResultStatus.DRAFT:
            self.status = ResultStatus.DRAFT
            self.reverted_by = user
            self.reverted_at = now
            if reason:
                self.revert_reason = reason
        self.save()

    def __str__(self):
        return f"{self.student.admission_number} - {self.examination_subject.subject.code}: {self.marks_obtained} [{self.status}]"
