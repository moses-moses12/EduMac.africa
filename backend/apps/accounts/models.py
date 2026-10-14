import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _

class UserRole(models.TextChoices):
    ADMIN = "ADMIN", "Administrator"
    HEADMASTER = "HEADMASTER", "Headmaster"
    ACADEMIC = "ACADEMIC", "Academic Officer"
    TEACHER = "TEACHER", "Teacher"
    STUDENT = "STUDENT", "Student"
    PARENT = "PARENT", "Parent/Guardian"
    ACCOUNTANT = "ACCOUNTANT", "Accountant"
    LIBRARIAN = "LIBRARIAN", "Librarian"
    EXAM_OFFICER = "EXAM_OFFICER", "Examination Officer"
    STAFF = "STAFF", "School Staff"

class UserManager(BaseUserManager):
    """Custom manager for User with email as unique identifier."""
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set.'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if not extra_fields.get('username'):
            user.username = email
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)

def avatar_upload_path(instance, filename):
    import os
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ['.jpg', '.jpeg', '.png', '.webp', '.gif']:
        ext = '.jpg'
    safe_name = f"{instance.id}_{uuid.uuid4().hex[:12]}{ext}"
    return os.path.join('avatars', safe_name)

class User(AbstractUser):
    """Custom User model using UUID primary key, email as unique identifier, and 10 role choices."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True, db_index=True)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.STAFF,
        db_index=True,
        help_text=_("The administrative or institutional role assigned to this user.")
    )
    phone_number = models.CharField(max_length=25, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to=avatar_upload_path, blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True, max_length=500)
    is_verified = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_avatar_url(self):
        if self.avatar:
            try:
                return self.avatar.url
            except Exception:
                pass
        return self.avatar_url

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'role']),
        ]

    def __str__(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        return f"{full_name or self.email} ({self.get_role_display()})"
