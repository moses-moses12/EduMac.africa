import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from apps.notifications.models import Notification, NotificationType

users = User.objects.all()
admin_user = User.objects.filter(role='ADMIN').first()
student_user = User.objects.filter(role='STUDENT').first() or admin_user

sample_notifications = [
    (
        "Terminal Examination Results Published",
        "Your official Grade Report Card for 2026 Term 1 has been verified by the Academic Board and published online. Overall GPA: 3.85 (A).",
        NotificationType.RESULT_PUBLISHED,
        False,
    ),
    (
        "New Physics Assignment: Thermodynamics",
        "Teacher Bennett posted a new laboratory homework task: 'Heat Transfer and Calorimetry'. Due date: Friday 23:59 EAT.",
        NotificationType.NEW_ASSIGNMENT,
        False,
    ),
    (
        "Tuition Fee Installment Reminder",
        "Reminder: The second term fee installment of TZS 24,500 for Form 4 is due in 5 calendar days. Pay via M-Pesa or bank transfer to avoid late penalties.",
        NotificationType.FEE_REMINDER,
        False,
    ),
    (
        "Attendance Advisory: Unexcused Absence",
        "Automated attendance monitor: You were recorded absent for Morning Roll Call on October 8. Please submit an excuse letter from your guardian.",
        NotificationType.ATTENDANCE_WARNING,
        True,
    ),
    (
        "National Mock Exam Schedule Released",
        "The finalized National Mock Examination timetable for Form 2 & Form 4 has been posted. First paper commences Monday at 08:30 AM in Main Hall.",
        NotificationType.EXAM_SCHEDULE,
        False,
    ),
    (
        "Annual Parents & Teachers Association (PTA) Conference",
        "All parents, guardians, and academic staff are cordially invited to the Annual General PTA Assembly this Saturday at 10:00 AM in the School Auditorium.",
        NotificationType.SCHOOL_ANNOUNCEMENT,
        True,
    ),
    (
        "Security Alert: New Sign-In from Windows 11",
        "Your account was accessed from a new IP address (192.168.1.45) in Dar es Salaam, Tanzania. If this was not you, reset your password immediately.",
        NotificationType.SECURITY_EVENT,
        False,
    ),
]

created_count = 0
for u in users:
    for title, message, ntype, is_read in sample_notifications:
        Notification.objects.create(
            user=u,
            title=title,
            message=message,
            notification_type=ntype,
            is_read=is_read,
        )
        created_count += 1

print(f"Successfully seeded {created_count} notifications across {users.count()} users!")
print(f"Total notifications in database: {Notification.objects.count()}")
