import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.academics.models import Stream, Subject
from apps.staff.models import Teacher

class DayOfWeek(models.TextChoices):
    MONDAY = 'MONDAY', _('Monday')
    TUESDAY = 'TUESDAY', _('Tuesday')
    WEDNESDAY = 'WEDNESDAY', _('Wednesday')
    THURSDAY = 'THURSDAY', _('Thursday')
    FRIDAY = 'FRIDAY', _('Friday')
    SATURDAY = 'SATURDAY', _('Saturday')

class Timetable(models.Model):
    """Weekly course scheduling slot per class stream."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    stream = models.ForeignKey(Stream, on_delete=models.CASCADE, related_name='timetable_slots')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='timetable_slots')
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name='timetable_slots')
    day_of_week = models.CharField(max_length=15, choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room_number = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['day_of_week', 'start_time']
        indexes = [
            models.Index(fields=['stream', 'day_of_week']),
        ]

    def __str__(self):
        return f"{self.stream.name} - {self.subject.code} ({self.day_of_week} {self.start_time}-{self.end_time})"
