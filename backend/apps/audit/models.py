import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

class AuditAction(models.TextChoices):
    LOGIN = 'LOGIN', _('User Login')
    LOGIN_FAILED = 'LOGIN_FAILED', _('Failed Login Attempt')
    LOGOUT = 'LOGOUT', _('User Logout')
    CREATE = 'CREATE', _('Create')
    UPDATE = 'UPDATE', _('Update')
    DELETE = 'DELETE', _('Delete')
    APPROVE = 'APPROVE', _('Approve')
    PUBLISH = 'PUBLISH', _('Publish')
    PAYMENT = 'PAYMENT', _('Payment Processed')
    RESULT_UPDATE = 'RESULT_UPDATE', _('Result Update')
    ROLE_CHANGE = 'ROLE_CHANGE', _('Role Change')
    PASSWORD_CHANGE = 'PASSWORD_CHANGE', _('Password Change')

class AuditLog(models.Model):
    """Immutable audit trail for institutional security, compliance, and activity auditing."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=30, choices=AuditAction.choices)
    object_type = models.CharField(max_length=100, blank=True, db_index=True)
    model_name = models.CharField(max_length=100, blank=True)
    object_id = models.CharField(max_length=100, blank=True, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    changes_json = models.JSONField(default=dict, blank=True)
    ip_address = models.CharField(max_length=45, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['object_type', 'object_id']),
            models.Index(fields=['model_name', 'object_id']),
        ]

    def save(self, *args, **kwargs):
        # Sync object_type with model_name and metadata with changes_json
        if not self.object_type and self.model_name:
            self.object_type = self.model_name
        elif not self.model_name and self.object_type:
            self.model_name = self.object_type
        if not self.metadata and self.changes_json:
            self.metadata = self.changes_json
        elif not self.changes_json and self.metadata:
            self.changes_json = self.metadata
        super().save(*args, **kwargs)

    def __str__(self):
        user_str = self.user.email if self.user else "Anonymous/System"
        target = self.object_type or self.model_name
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {user_str} -> {self.action} on {target}"
