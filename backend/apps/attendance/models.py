import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.students.models import Student
from apps.academics.models import Stream, Subject, Class, AcademicYear, Term

class AttendanceStatus(models.TextChoices):
    PRESENT = 'PRESENT', _('Present')
    ABSENT = 'ABSENT', _('Absent')
    LATE = 'LATE', _('Late')
    EXCUSED = 'EXCUSED', _('Excused')

class AttendanceType(models.TextChoices):
    DAILY = 'DAILY', _('Daily Attendance')
    CLASS = 'CLASS', _('Class Attendance')
    SUBJECT = 'SUBJECT', _('Subject Attendance')

class Attendance(models.Model):
    """Daily, class or subject attendance records for students."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendances')
    class_obj = models.ForeignKey(Class, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendances')
    stream = models.ForeignKey(Stream, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendances')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendances')
    term = models.ForeignKey(Term, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendances')
    date = models.DateField(db_index=True)
    attendance_type = models.CharField(max_length=15, choices=AttendanceType.choices, default=AttendanceType.DAILY, db_index=True)
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendances')
    status = models.CharField(max_length=15, choices=AttendanceStatus.choices, default=AttendanceStatus.PRESENT)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', 'student']
        indexes = [
            models.Index(fields=['date', 'status']),
            models.Index(fields=['attendance_type', 'date']),
        ]
        unique_together = ('student', 'date', 'attendance_type', 'subject')

    def __str__(self):
        subj_str = f" [{self.subject.code}]" if self.subject else ""
        return f"{self.student.admission_number} - {self.date}{subj_str} [{self.get_status_display()}]"
