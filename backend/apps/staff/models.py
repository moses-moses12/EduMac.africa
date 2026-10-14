import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Teacher(models.Model):
    """Academic teaching staff profile."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='teacher_profile')
    employee_id = models.CharField(max_length=50, unique=True, db_index=True)
    qualification = models.CharField(max_length=150, blank=True)
    specialization = models.CharField(max_length=150, blank=True)
    joining_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['user__first_name', 'user__last_name']
        verbose_name = _('Teacher')
        verbose_name_plural = _('Teachers')

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.email} [{self.employee_id}]"

class Staff(models.Model):
    """Non-teaching, administrative, and operations staff profile."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='staff_profile')
    employee_id = models.CharField(max_length=50, unique=True, db_index=True)
    department = models.CharField(max_length=100, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    joining_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['user__first_name', 'user__last_name']
        verbose_name = _('Staff Member')
        verbose_name_plural = _('Staff Members')

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.email} - {self.designation}"
