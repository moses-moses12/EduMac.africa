import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class NotificationType(models.TextChoices):
    # Specialized notification center types
    RESULT_PUBLISHED = 'RESULT_PUBLISHED', _('Result Published')
    NEW_ASSIGNMENT = 'NEW_ASSIGNMENT', _('New Assignment')
    FEE_REMINDER = 'FEE_REMINDER', _('Fee Reminder')
    ATTENDANCE_WARNING = 'ATTENDANCE_WARNING', _('Attendance Warning')
    EXAM_SCHEDULE = 'EXAM_SCHEDULE', _('Exam Schedule')
    SCHOOL_ANNOUNCEMENT = 'SCHOOL_ANNOUNCEMENT', _('School Announcement')
    SECURITY_EVENT = 'SECURITY_EVENT', _('Account Security Event')
    # Core types
    SYSTEM = 'SYSTEM', _('System')
    ACADEMIC = 'ACADEMIC', _('Academic')
    FEE = 'FEE', _('Finance/Fee')
    EXAM = 'EXAM', _('Examination')
    GENERAL = 'GENERAL', _('General Notice')

class Notification(models.Model):
    """Personalized user inbox alerts and institutional notifications."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices, default=NotificationType.GENERAL, db_index=True)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['notification_type', 'is_read']),
        ]

    @property
    def recipient(self):
        return self.user

    @property
    def type(self):
        return self.notification_type

    def __str__(self):
        return f"{self.user.email} - {self.title} [{'Read' if self.is_read else 'Unread'}]"
