import os
import django
from datetime import date
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from apps.accounts.models import User, UserRole
from apps.results.models import Result, ResultStatus
from apps.results.views import ResultViewSet
from apps.fees.views import FeeStructureViewSet
from apps.audit.views import AuditLogViewSet
from apps.accounts.views import UserViewSet
from apps.students.models import Student
from apps.students.views import StudentViewSet, ParentViewSet, StudentEnrollmentViewSet
from apps.communication.views import AnnouncementViewSet
from apps.reports.views import AdvancedAnalyticsReportView

def verify_reception_staff_and_analytics():
    print("=" * 80)
    print("VERIFYING RECEPTION / STAFF SECURITY BOUNDARIES & EXECUTIVE ANALYTICS API")
    print("=" * 80)

    factory = APIRequestFactory()

    # 1. Setup Staff / Receptionist User
    staff_user = User.objects.filter(email="test_reception@school.edu").first()
    if not staff_user:
        staff_user = User.objects.create_user(
            email="test_reception@school.edu",
            username="test_reception@school.edu",
            first_name="Patricia",
            last_name="Cole",
            role=UserRole.STAFF
        )
    staff_user.role = UserRole.STAFF
    staff_user.save()

    print(f"\n[1] Testing Reception Staff User: {staff_user.email} (Role: {staff_user.role})")

    # ─── A. AUTHORIZED FRONT-OFFICE CAPABILITIES ───
    print("\n--- A. Authorized Front-Office Access ---")

    # A1. Student Records Access
    stu_view = StudentViewSet.as_view({'get': 'list'})
    req = factory.get('/api/v1/students/')
    force_authenticate(req, user=staff_user)
    resp = stu_view(req)
    assert resp.status_code == status.HTTP_200_OK, f"Expected 200 for student records, got {resp.status_code}"
    print(f"  ✓ Student Records Listing: 200 OK (Accessible for Front-Office Search & Verification)")

    # A2. Guardian Information Access
    parent_view = ParentViewSet.as_view({'get': 'list'})
    req = factory.get('/api/v1/students/parents/')
    force_authenticate(req, user=staff_user)
    resp = parent_view(req)
    assert resp.status_code == status.HTTP_200_OK, f"Expected 200 for parents, got {resp.status_code}"
    print(f"  ✓ Guardian Directory Listing: 200 OK (Accessible for Emergency Contact Inquiries)")

    # A3. Student Enrollments Access
    enr_view = StudentEnrollmentViewSet.as_view({'get': 'list'})
    req = factory.get('/api/v1/students/enrollments/')
    force_authenticate(req, user=staff_user)
    resp = enr_view(req)
    assert resp.status_code == status.HTTP_200_OK, f"Expected 200 for enrollments, got {resp.status_code}"
    print(f"  ✓ Enrollment Records Listing: 200 OK (Accessible for Class Allocation & Transfers)")

    # A4. Campus Announcements Access
    ann_view = AnnouncementViewSet.as_view({'get': 'list'})
    req = factory.get('/api/v1/communication/announcements/')
    force_authenticate(req, user=staff_user)
    resp = ann_view(req)
    assert resp.status_code == status.HTTP_200_OK, f"Expected 200 for announcements, got {resp.status_code}"
    print(f"  ✓ Campus Announcements Listing: 200 OK (Accessible for Front-Office Notices)")

    # A5. Published Results (Read-only for official front-desk queries)
    res_view = ResultViewSet.as_view({'get': 'list'})
    req = factory.get('/api/v1/results/')
    force_authenticate(req, user=staff_user)
    resp = res_view(req)
    assert resp.status_code == status.HTTP_200_OK, f"Expected 200 for results list, got {resp.status_code}"
    results_list = resp.data.get('results', resp.data) if isinstance(resp.data, dict) else resp.data
    for r in results_list:
        assert r.get('status') == ResultStatus.PUBLISHED or r.get('status') == 'PUBLISHED', \
            f"Staff should only see PUBLISHED results! Found: {r.get('status')}"
    print(f"  ✓ Results Filtered to PUBLISHED Only: 200 OK (Draft/unmoderated marks hidden from staff)")

    # ─── B. RESTRICTED SECURITY BOUNDARIES (MUST BE 403 FORBIDDEN) ───
    print("\n--- B. Restricted Security Boundaries (Enforced RBAC & HTTP 403) ---")

    # B1. Marks / Result Creation Restriction
    res_create_view = ResultViewSet.as_view({'post': 'create'})
    req = factory.post('/api/v1/results/', {'score': 85}, format='json')
    force_authenticate(req, user=staff_user)
    resp = res_create_view(req)
    assert resp.status_code == status.HTTP_403_FORBIDDEN, f"Staff must NOT create results! Got {resp.status_code}"
    print(f"  ✓ Result Creation Blocked: 403 FORBIDDEN (Reception cannot enter/create marks)")

    # B2. Bulk Entry Restriction
    bulk_view = ResultViewSet.as_view({'post': 'bulk_entry'})
    req = factory.post('/api/v1/results/bulk_entry/', {'entries': []}, format='json')
    force_authenticate(req, user=staff_user)
    resp = bulk_view(req)
    assert resp.status_code == status.HTTP_403_FORBIDDEN, f"Staff must NOT bulk enter marks! Got {resp.status_code}"
    print(f"  ✓ Result Bulk Entry Blocked: 403 FORBIDDEN")

    # B3. Fee Structure Configuration Restriction
    fs_create_view = FeeStructureViewSet.as_view({'post': 'create'})
    req = factory.post('/api/v1/fees/structures/', {'tuition': 50000}, format='json')
    force_authenticate(req, user=staff_user)
    resp = fs_create_view(req)
    assert resp.status_code == status.HTTP_403_FORBIDDEN, f"Staff must NOT configure fees! Got {resp.status_code}"
    print(f"  ✓ Fee Structure Configuration Blocked: 403 FORBIDDEN (Accountant privilege required)")

    # B4. Audit Log Access Restriction
    audit_view = AuditLogViewSet.as_view({'get': 'list'})
    req = factory.get('/api/v1/audit/')
    force_authenticate(req, user=staff_user)
    resp = audit_view(req)
    assert resp.status_code == status.HTTP_403_FORBIDDEN, f"Staff must NOT read raw audit logs! Got {resp.status_code}"
    print(f"  ✓ Audit Logs Access Blocked: 403 FORBIDDEN (Admin privilege required)")

    # B5. User Account Provisioning Restriction
    user_create_view = UserViewSet.as_view({'post': 'create'})
    req = factory.post('/api/v1/users/', {'email': 'hacker@school.edu', 'role': 'ADMIN'}, format='json')
    force_authenticate(req, user=staff_user)
    resp = user_create_view(req)
    assert resp.status_code == status.HTTP_403_FORBIDDEN, f"Staff must NOT provision users! Got {resp.status_code}"
    print(f"  ✓ User Provisioning Blocked: 403 FORBIDDEN (Admin privilege required)")

    # ─── C. EXECUTIVE ANALYTICS API (HEADMASTER & ADMIN) ───
    print("\n--- C. Headmaster & Admin Analytics API ---")

    admin_user = User.objects.filter(role=UserRole.ADMIN).first()
    if not admin_user:
        admin_user = User.objects.create_superuser('admin_exec@school.edu', 'admin_exec@school.edu', 'AdminPass123!')

    analytics_view = AdvancedAnalyticsReportView.as_view()
    req = factory.get('/api/v1/reports/analytics/')
    force_authenticate(req, user=admin_user)
    resp = analytics_view(req)
    assert resp.status_code == status.HTTP_200_OK, f"Analytics API failed: {resp.status_code}"

    data = resp.data
    required_dimensions = [
        'enrollment_trend',
        'attendance_trend',
        'fee_collection_trend',
        'academic_trend',
        'grade_distribution',
        'class_comparison',
        'subject_performance',
        'monthly_activities'
    ]

    print(f"  Data Source Engine: {data.get('meta', {}).get('data_source')}")
    for dim in required_dimensions:
        assert dim in data, f"Missing requested dimension: {dim}"
        items_count = len(data[dim])
        print(f"  ✓ Dimension '{dim}': {items_count} data points connected")

    print("\n" + "=" * 80)
    print("ALL RECEPTION STAFF RBAC BOUNDARIES AND EXECUTIVE ANALYTICS PASSED!")
    print("=" * 80)

if __name__ == '__main__':
    verify_reception_staff_and_analytics()
