import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from apps.accounts.models import User
from apps.notifications.models import Notification, NotificationType
from apps.notifications.views import NotificationViewSet
from apps.notifications.serializers import NotificationSerializer

def run_tests():
    print("==================================================")
    print("VERIFYING NOTIFICATION CENTER & ALL 7 EVENT TYPES")
    print("==================================================")

    factory = APIRequestFactory()

    admin_user = User.objects.filter(role='ADMIN').first()
    student_user = User.objects.filter(role='STUDENT').first()
    teacher_user = User.objects.filter(role='TEACHER').first()
    parent_user = User.objects.filter(role='PARENT').first()

    assert admin_user, "Admin user must exist"
    assert student_user, "Student user must exist"

    # 1. Verify all 7 required notification types exist in NotificationType enum
    required_types = [
        ('Result published', NotificationType.RESULT_PUBLISHED),
        ('New assignment', NotificationType.NEW_ASSIGNMENT),
        ('Fee reminder', NotificationType.FEE_REMINDER),
        ('Attendance warning', NotificationType.ATTENDANCE_WARNING),
        ('Exam schedule', NotificationType.EXAM_SCHEDULE),
        ('School announcement', NotificationType.SCHOOL_ANNOUNCEMENT),
        ('Account security event', NotificationType.SECURITY_EVENT),
    ]

    print("\n✓ Checking required notification types:")
    for label, ntype in required_types:
        print(f"  • {label} -> {ntype}")
        assert ntype in NotificationType.values, f"{ntype} missing from NotificationType"

    # 2. Seed all 7 sample notifications for the student
    created_notifs = []
    sample_data = [
        (
            "Terminal Examination Results Published",
            "Your official Grade Report Card for 2026 Term 1 has been verified and published online. Overall GPA: 3.85 (A).",
            NotificationType.RESULT_PUBLISHED,
        ),
        (
            "New Physics Assignment: Thermodynamics",
            "Teacher Bennett posted a new laboratory homework task: 'Heat Transfer and Calorimetry'. Due date: Friday 23:59 EAT.",
            NotificationType.NEW_ASSIGNMENT,
        ),
        (
            "Tuition Fee Installment Reminder",
            "Reminder: The second term fee installment of TZS 24,500 for Form 4 is due in 5 calendar days.",
            NotificationType.FEE_REMINDER,
        ),
        (
            "Attendance Advisory: Unexcused Absence",
            "Automated attendance monitor: You were recorded absent for Morning Roll Call on October 8.",
            NotificationType.ATTENDANCE_WARNING,
        ),
        (
            "National Mock Exam Schedule Released",
            "The finalized National Mock Examination timetable for Form 2 & Form 4 has been posted. First paper commences Monday 08:30 AM.",
            NotificationType.EXAM_SCHEDULE,
        ),
        (
            "Annual Parents & Teachers Association (PTA) Conference",
            "All parents, guardians, and academic staff are invited to the Annual General PTA Assembly this Saturday.",
            NotificationType.SCHOOL_ANNOUNCEMENT,
        ),
        (
            "Security Alert: New Sign-In from Windows 11",
            "Your account was accessed from a new IP address (192.168.1.45) in Dar es Salaam, Tanzania.",
            NotificationType.SECURITY_EVENT,
        ),
    ]

    for title, message, ntype in sample_data:
        notif, _ = Notification.objects.get_or_create(
            user=student_user,
            title=title,
            defaults={
                'message': message,
                'notification_type': ntype,
                'is_read': False,
            }
        )
        created_notifs.append(notif)

    # 3. Verify Serializer output has all required fields: title, message, type, recipient, is_read, created_at
    print("\n✓ Checking serialized notification fields:")
    serializer = NotificationSerializer(created_notifs[0])
    data = serializer.data
    required_fields = ['title', 'message', 'type', 'recipient', 'is_read', 'created_at']
    for field in required_fields:
        assert field in data, f"Required field '{field}' missing from serialized output"
        print(f"  • Field '{field}' present: {data[field]}")

    # 4. Test List API as student
    view_list = NotificationViewSet.as_view({'get': 'list'})
    req = factory.get('/api/v1/notifications/')
    force_authenticate(req, user=student_user)
    resp = view_list(req)
    assert resp.status_code == 200, f"List failed with status {resp.status_code}"
    results = resp.data.get('results', resp.data)
    print(f"\n✓ Student notification inbox count: {len(results)} items (Status 200)")

    # 5. Test Filtering by Type
    for _, ntype in required_types:
        req_filter = factory.get(f'/api/v1/notifications/?type={ntype}')
        force_authenticate(req_filter, user=student_user)
        resp_filter = view_list(req_filter)
        assert resp_filter.status_code == 200
        filtered_results = resp_filter.data.get('results', resp_filter.data)
        assert len(filtered_results) >= 1, f"Filtered results for {ntype} should be >= 1"
        assert all(item['type'] == ntype or item.get('notification_type') == ntype for item in filtered_results)
    print("✓ Filter by type verified for all 7 event types!")

    # 6. Test Unread Count endpoint
    view_unread = NotificationViewSet.as_view({'get': 'unread_count'})
    req_unread = factory.get('/api/v1/notifications/unread-count/')
    force_authenticate(req_unread, user=student_user)
    resp_unread = view_unread(req_unread)
    assert resp_unread.status_code == 200
    unread_count = resp_unread.data['unread_count']
    print(f"✓ Unread count endpoint verified: {unread_count} unread notifications")

    # 7. Test Mark as Read endpoint
    first_notif = created_notifs[0]
    view_mark_read = NotificationViewSet.as_view({'post': 'mark_as_read'})
    req_mark = factory.post(f'/api/v1/notifications/{first_notif.id}/read/')
    force_authenticate(req_mark, user=student_user)
    resp_mark = view_mark_read(req_mark, pk=str(first_notif.id))
    assert resp_mark.status_code == 200
    first_notif.refresh_from_db()
    assert first_notif.is_read is True
    print(f"✓ Mark as read verified for notification: {first_notif.id}")

    # 8. Test Mark All as Read endpoint
    view_mark_all = NotificationViewSet.as_view({'post': 'mark_all_read'})
    req_mark_all = factory.post('/api/v1/notifications/read-all/')
    force_authenticate(req_mark_all, user=student_user)
    resp_mark_all = view_mark_all(req_mark_all)
    assert resp_mark_all.status_code == 200
    assert resp_mark_all.data['success'] is True
    print(f"✓ Mark all as read verified: {resp_mark_all.data['updated_count']} items updated")

    # 9. Test Administrative Broadcast endpoint
    view_broadcast = NotificationViewSet.as_view({'post': 'broadcast'})
    broadcast_payload = {
        'title': 'Campus Wide Emergency Drill Alert',
        'message': 'Mandatory fire evacuation drill scheduled for tomorrow at 11:00 AM.',
        'type': NotificationType.SECURITY_EVENT,
        'target_role': 'ALL'
    }
    req_broadcast = factory.post('/api/v1/notifications/broadcast/', broadcast_payload, format='json')
    force_authenticate(req_broadcast, user=admin_user)
    resp_broadcast = view_broadcast(req_broadcast)
    assert resp_broadcast.status_code == 200
    print(f"✓ Admin broadcast alert verified: delivered to {resp_broadcast.data['count']} campus accounts")

    # 10. Test Broadcast Permission Restriction (Students cannot broadcast)
    req_bad_broadcast = factory.post('/api/v1/notifications/broadcast/', broadcast_payload, format='json')
    force_authenticate(req_bad_broadcast, user=student_user)
    resp_bad_broadcast = view_broadcast(req_bad_broadcast)
    assert resp_bad_broadcast.status_code == 403
    print("✓ Security guard verified: Non-admin users forbidden from broadcasting (HTTP 403)")

    print("\n==================================================")
    print("ALL NOTIFICATION CENTER & TYPE VERIFICATIONS PASSED!")
    print("==================================================")

if __name__ == '__main__':
    run_tests()
