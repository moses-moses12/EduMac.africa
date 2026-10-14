import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class PriorityLevel(models.TextChoices):
    LOW = 'LOW', _('Low')
    MEDIUM = 'MEDIUM', _('Medium')
    HIGH = 'HIGH', _('High')
    URGENT = 'URGENT', _('Urgent')

class Announcement(models.Model):
    """Institutional announcements broadcasted to specific roles or the whole school."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    content = models.TextField()
    target_roles = models.CharField(
        max_length=255,
        default='ALL',
        help_text="Comma-separated roles (e.g. ALL, TEACHER, STUDENT, PARENT) or ALL"
    )
    priority = models.CharField(max_length=15, choices=PriorityLevel.choices, default=PriorityLevel.MEDIUM)
    posted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='announcements')
    valid_until = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.priority}] {self.title}"
