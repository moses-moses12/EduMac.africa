import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.academics.models import Class, Stream, AcademicYear

class Parent(models.Model):
    """Parent or Legal Guardian profile."""
    RELATION_CHOICES = [
        ('FATHER', 'Father'),
        ('MOTHER', 'Mother'),
        ('GUARDIAN', 'Legal Guardian'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='parent_profile')
    relationship_type = models.CharField(max_length=20, choices=RELATION_CHOICES, default='GUARDIAN')
    occupation = models.CharField(max_length=100, blank=True)
    alternate_phone = models.CharField(max_length=25, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['user__first_name', 'user__last_name']
        verbose_name = _('Parent/Guardian')
        verbose_name_plural = _('Parents/Guardians')

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.email} ({self.get_relationship_type_display()})"

class GenderChoice(models.TextChoices):
    MALE = 'MALE', _('Male')
    FEMALE = 'FEMALE', _('Female')
    OTHER = 'OTHER', _('Other')

class StudentStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', _('Active')
    INACTIVE = 'INACTIVE', _('Inactive')
    GRADUATED = 'GRADUATED', _('Graduated')
    TRANSFERRED = 'TRANSFERRED', _('Transferred')
    SUSPENDED = 'SUSPENDED', _('Suspended')
    ARCHIVED = 'ARCHIVED', _('Archived')

class Student(models.Model):
    """Student profile linked to User account and academic tracking."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_profile')
    admission_number = models.CharField(max_length=50, unique=True, db_index=True)
    parent = models.ForeignKey(Parent, on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GenderChoice.choices, default=GenderChoice.MALE)
    blood_group = models.CharField(max_length=5, blank=True)
    emergency_contact = models.CharField(max_length=25, blank=True)
    phone_number = models.CharField(max_length=25, blank=True)
    address = models.TextField(blank=True)
    profile_photo = models.URLField(max_length=500, blank=True, null=True)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    current_class = models.ForeignKey(Class, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    current_stream = models.ForeignKey(Stream, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    admission_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=StudentStatus.choices, default=StudentStatus.ACTIVE, db_index=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['admission_number']
        verbose_name = _('Student')
        verbose_name_plural = _('Students')

    def save(self, *args, **kwargs):
        self.is_active = (self.status == StudentStatus.ACTIVE)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.email} ({self.admission_number}) [{self.get_status_display()}]"

class EnrollmentStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', _('Active')
    PROMOTED = 'PROMOTED', _('Promoted')
    REPEATED = 'REPEATED', _('Repeated')
    GRADUATED = 'GRADUATED', _('Graduated')
    WITHDRAWN = 'WITHDRAWN', _('Withdrawn')

class StudentEnrollment(models.Model):
    """Historical and current academic session enrollment records for students."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='enrollments')
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='enrollments', verbose_name=_('Class'))
    stream = models.ForeignKey(Stream, on_delete=models.SET_NULL, null=True, blank=True, related_name='enrollments')
    status = models.CharField(max_length=20, choices=EnrollmentStatus.choices, default=EnrollmentStatus.ACTIVE)
    enrollment_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'academic_year')
        ordering = ['-academic_year__start_date', 'student']

    def __str__(self):
        return f"{self.student.admission_number} - {self.class_obj.name} ({self.academic_year.name})"
