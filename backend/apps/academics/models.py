import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _

class AcademicYear(models.Model):
    """Represents a full academic school calendar year (e.g. 2026/2027)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']
        verbose_name = _('Academic Year')
        verbose_name_plural = _('Academic Years')

    def save(self, *args, **kwargs):
        if self.is_current:
            AcademicYear.objects.exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name}{' (Current)' if self.is_current else ''}"

class Term(models.Model):
    """Academic Term or Semester within an Academic Year."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='terms')
    name = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('academic_year', 'name')
        ordering = ['academic_year', 'start_date']

    def save(self, *args, **kwargs):
        if self.is_current:
            Term.objects.exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.academic_year.name}"

class Class(models.Model):
    """Grade level or Standard (e.g. Grade 10, Form 4, Year 8)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    academic_stage = models.CharField(max_length=50, blank=True, help_text="e.g. Primary, Junior High, Senior Secondary")
    order = models.PositiveSmallIntegerField(default=1)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.SET_NULL, null=True, blank=True, related_name='classes')
    term = models.ForeignKey(Term, on_delete=models.SET_NULL, null=True, blank=True, related_name='classes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = _('Classes')

    def __str__(self):
        return f"{self.name} ({self.code})"

class Stream(models.Model):
    """Stream / Division / Section within a Class (e.g. Grade 10-A, Grade 10-B)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='streams', verbose_name=_('Class'))
    name = models.CharField(max_length=100)
    capacity = models.PositiveIntegerField(default=40)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('class_obj', 'name')
        ordering = ['class_obj', 'name']

    def __str__(self):
        return f"{self.class_obj.name} - {self.name}"

class Subject(models.Model):
    """Curriculum subject offered by the institution."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=100, blank=True, help_text="e.g. Mathematics, Sciences, Humanities")
    is_elective = models.BooleanField(default=False)
    credit_units = models.DecimalField(max_digits=4, decimal_places=1, default=3.0)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} [{self.code}]"

class TeacherAssignment(models.Model):
    """Assigns teachers to teach specific subjects to classes and streams in an academic term."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey('staff.Teacher', on_delete=models.CASCADE, related_name='teaching_assignments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='teacher_assignments')
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='teacher_assignments', verbose_name=_('Class'))
    stream = models.ForeignKey(Stream, on_delete=models.SET_NULL, null=True, blank=True, related_name='teacher_assignments')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='teacher_assignments')
    term = models.ForeignKey(Term, on_delete=models.SET_NULL, null=True, blank=True, related_name='teacher_assignments')
    is_class_teacher = models.BooleanField(default=False)
    periods_per_week = models.PositiveSmallIntegerField(default=4)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['class_obj', 'subject', 'teacher']
        unique_together = ('teacher', 'subject', 'class_obj', 'stream', 'academic_year', 'term')
        verbose_name = _('Teacher Assignment')
        verbose_name_plural = _('Teacher Assignments')

    def __str__(self):
        stream_str = f" - {self.stream.name}" if self.stream else ""
        return f"{self.teacher.user.get_full_name()} -> {self.subject.code} ({self.class_obj.name}{stream_str})"

class CalendarEventType(models.TextChoices):
    TERM_DATES = 'TERM_DATES', _('Term Dates')
    EXAMINATION = 'EXAMINATION', _('Examination Period')
    HOLIDAY = 'HOLIDAY', _('School Holiday')
    MEETING = 'MEETING', _('Staff / PTA Meeting')
    SPORTS = 'SPORTS', _('Sports & Co-curricular')
    GENERAL = 'GENERAL', _('General Academic Event')

class AcademicCalendar(models.Model):
    """Institutional calendar milestones and scheduled school events."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='calendar_events')
    term = models.ForeignKey(Term, on_delete=models.SET_NULL, null=True, blank=True, related_name='calendar_events')
    title = models.CharField(max_length=150)
    event_type = models.CharField(max_length=30, choices=CalendarEventType.choices, default=CalendarEventType.GENERAL)
    start_date = models.DateField()
    end_date = models.DateField()
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_date', 'title']
        verbose_name = _('Academic Calendar Event')
        verbose_name_plural = _('Academic Calendar Events')

    def __str__(self):
        return f"{self.title} ({self.start_date} to {self.end_date}) [{self.get_event_type_display()}]"
