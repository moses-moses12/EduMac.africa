import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from apps.academics.models import Subject, Stream
from apps.staff.models import Teacher
from apps.students.models import Student

class Assignment(models.Model):
    """Coursework tasks issued to students by teachers."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='assignments')
    stream = models.ForeignKey(Stream, on_delete=models.CASCADE, related_name='assignments')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='assignments')
    due_date = models.DateTimeField()
    max_marks = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    attachment_url = models.URLField(blank=True, null=True, max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-due_date']

    def __str__(self):
        return f"{self.title} ({self.subject.code}) - Due: {self.due_date.strftime('%Y-%m-%d')}"

class SubmissionStatus(models.TextChoices):
    SUBMITTED = 'SUBMITTED', _('Submitted')
    GRADED = 'GRADED', _('Graded')
    LATE = 'LATE', _('Late Submission')
    RESUBMISSION = 'RESUBMISSION', _('Resubmission Requested')

class AssignmentSubmission(models.Model):
    """Student answers, attachments, marks and teacher reviews."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='assignment_submissions')
    submission_date = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(default=timezone.now)
    content = models.TextField(blank=True)
    attachment_url = models.URLField(blank=True, null=True, max_length=500)
    marks_awarded = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=SubmissionStatus.choices, default=SubmissionStatus.SUBMITTED)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('assignment', 'student')
        ordering = ['-submission_date']
        indexes = [
            models.Index(fields=['assignment', 'status']),
        ]

    def __str__(self):
        return f"{self.student.admission_number} - {self.assignment.title} [{self.get_status_display()}]"
