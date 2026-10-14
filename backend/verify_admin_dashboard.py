import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from apps.accounts.models import User, UserRole
from apps.accounts.views import UserViewSet
from apps.reports.views import ExecutiveDashboardReportView
from apps.audit.views import AuditLogViewSet
from apps.notifications.views import NotificationViewSet

def run_tests():
    factory = APIRequestFactory()
    print("=== STARTING ADMIN DASHBOARD VERIFICATION ===")

    # 1. Setup Admin User
    admin_user, _ = User.objects.get_or_create(
        email="admin.verify@apexschool.edu",
        defaults={
            "username": "admin.verify",
            "first_name": "Admin",
            "last_name": "Tester",
            "role": UserRole.ADMIN,
            "is_staff": True,
            "is_superuser": True
        }
    )
    admin_user.role = UserRole.ADMIN
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.save()

    # 2. Test Executive Report (All 8 core metrics)
    req = factory.get('/api/v1/reports/executive/')
    force_authenticate(req, user=admin_user)
    view = ExecutiveDashboardReportView.as_view()
    resp = view(req)
    assert resp.status_code == 200, f"Executive report failed: {resp.status_code}"
    metrics = resp.data.get('metrics', {})
    
    assert 'total_students' in metrics, "Missing total_students"
    assert 'total_teachers' in metrics, "Missing total_teachers"
    assert 'total_staff' in metrics, "Missing total_staff"
    assert 'total_classes' in metrics, "Missing total_classes"
    assert 'attendance_rate' in metrics, "Missing attendance_rate"
    assert 'total_collected' in metrics, "Missing total_collected (Fee Collection)"
    assert 'total_outstanding' in metrics, "Missing total_outstanding (Outstanding Fees)"
    assert 'academic_average' in metrics, "Missing academic_average (Academic Performance)"
    print("PASS 1: Executive KPI Metrics endpoint returns all 8 required metrics:")
    print(f"  - Total Students: {metrics['total_students']}")
    print(f"  - Total Teachers: {metrics['total_teachers']}")
    print(f"  - Total Staff: {metrics['total_staff']}")
    print(f"  - Total Classes: {metrics['total_classes']}")
    print(f"  - Attendance Rate: {metrics['attendance_rate']}%")
    print(f"  - Fee Collection: {metrics['total_collected']}")
    print(f"  - Outstanding Fees: {metrics['total_outstanding']}")
    print(f"  - Academic Performance: {metrics['academic_average']}%")

    # 3. Test User Management
    req = factory.get('/api/v1/accounts/users/')
    force_authenticate(req, user=admin_user)
    view = UserViewSet.as_view({'get': 'list'})
    resp = view(req)
    assert resp.status_code == 200, f"User list failed: {resp.status_code}"
    print(f"PASS 2: Admin User Management endpoint accessible (Status 200)")

    # 4. Test Audit Log (Recent Activities)
    req = factory.get('/api/v1/audit/logs/')
    force_authenticate(req, user=admin_user)
    view = AuditLogViewSet.as_view({'get': 'list'})
    resp = view(req)
    assert resp.status_code == 200, f"Audit logs failed: {resp.status_code}"
    print(f"PASS 3: Recent Activities / Audit stream accessible (Status 200)")

    # 5. Test Notifications
    req = factory.get('/api/v1/notifications/')
    force_authenticate(req, user=admin_user)
    view = NotificationViewSet.as_view({'get': 'list'})
    resp = view(req)
    assert resp.status_code == 200, f"Notifications failed: {resp.status_code}"
    print(f"PASS 4: Notifications endpoint accessible (Status 200)")

    print("\nALL ADMIN DASHBOARD BACKEND SERVICES VERIFIED COMPLETELY!")

if __name__ == '__main__':
    run_tests()
