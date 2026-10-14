import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from apps.accounts.models import User, UserRole
from apps.reports.views import HeadmasterAnalyticsView
from apps.accounts.views import UserViewSet
from apps.audit.views import AuditLogViewSet
from apps.results.views import ResultViewSet
from apps.communication.views import AnnouncementViewSet
from apps.examinations.models import Examination, ExaminationType, ExaminationPeriod, ExaminationSubject, Subject, Grade
from apps.results.models import Result, ResultStatus
from apps.students.models import Student
from apps.academics.models import Class, AcademicYear, Term
from datetime import date

def run_headmaster_verification():
    print("=" * 70)
    print("VERIFYING HEADMASTER DASHBOARD & RBAC PRIVILEGES")
    print("=" * 70)
    
    factory = APIRequestFactory()

    # 1. Ensure test Headmaster user exists
    hm_user = User.objects.filter(email="test_headmaster@school.edu").first()
    if not hm_user:
        hm_user = User.objects.create_user(
            email="test_headmaster@school.edu",
            username="test_headmaster@school.edu",
            first_name="Dr. James",
            last_name="Mwangi",
            role=UserRole.HEADMASTER,
            is_staff=False,
            is_superuser=False,
        )
    else:
        hm_user.role = UserRole.HEADMASTER
        hm_user.is_staff = False
        hm_user.is_superuser = False
        hm_user.save()
    print(f"[OK] Headmaster User ready: {hm_user.email} (Role: {hm_user.role}, Superuser: {hm_user.is_superuser})")

    # 2. Test Management Analytics API (/api/v1/reports/headmaster/)
    hm_view = HeadmasterAnalyticsView.as_view()
    req = factory.get('/api/v1/reports/headmaster/')
    force_authenticate(req, user=hm_user)
    resp = hm_view(req)
    
    assert resp.status_code == status.HTTP_200_OK, f"Expected 200 OK, got {resp.status_code}"
    data = resp.data
    
    required_dimensions = [
        "student_population",
        "attendance",
        "academic_performance",
        "fee_overview",
        "teacher_statistics",
        "class_performance",
        "examination_performance",
        "announcements",
        "management_reports",
        "important_alerts",
        "permissions_boundary",
    ]
    for dim in required_dimensions:
        assert dim in data, f"Missing dimension '{dim}' in Headmaster Analytics payload"
        print(f"  ✓ Dimension verified: {dim}")

    assert data["permissions_boundary"]["is_technical_admin"] is False
    assert data["permissions_boundary"]["can_manage_users"] is False
    assert data["permissions_boundary"]["can_approve_examinations"] is True
    print("[PASS] 10/10 Management Analytics dimensions & permissions boundary verified.")

    # 3. Test Security Boundary: Headmaster should NOT receive technical system administration permissions!
    print("\n--- Verifying Technical Security Boundary (Headmaster Forbidden from Admin) ---")

    # 3a. User Management endpoint (/api/v1/users/)
    user_view = UserViewSet.as_view({'get': 'list'})
    req_users = factory.get('/api/v1/users/')
    force_authenticate(req_users, user=hm_user)
    resp_users = user_view(req_users)
    assert resp_users.status_code == status.HTTP_403_FORBIDDEN, f"Security Breach! Headmaster accessed /api/v1/users/ with status {resp_users.status_code}"
    print(f"  ✓ User Management API (/api/v1/users/): Blocked with {resp_users.status_code} FORBIDDEN")

    # 3b. Audit Log endpoint (/api/v1/audit/)
    audit_view = AuditLogViewSet.as_view({'get': 'list'})
    req_audit = factory.get('/api/v1/audit/')
    force_authenticate(req_audit, user=hm_user)
    resp_audit = audit_view(req_audit)
    assert resp_audit.status_code == status.HTTP_403_FORBIDDEN, f"Security Breach! Headmaster accessed /api/v1/audit/ with status {resp_audit.status_code}"
    print(f"  ✓ Audit Logs API (/api/v1/audit/): Blocked with {resp_audit.status_code} FORBIDDEN")

    # 4. Test Headmaster Examination Approval Privileges
    print("\n--- Verifying Headmaster Result Approval Workflow ---")
    
    # Setup test result in VERIFIED state
    year, _ = AcademicYear.objects.get_or_create(name="2026/2027", defaults={"start_date": date(2026, 1, 1), "end_date": date(2026, 12, 31)})
    term, _ = Term.objects.get_or_create(academic_year=year, name="Term 1", defaults={"start_date": date(2026, 1, 1), "end_date": date(2026, 4, 30)})
    ex_type, _ = ExaminationType.objects.get_or_create(code="MID_TERM_HM", defaults={"name": "Mid-Term HM Assessment", "default_weightage": 30.0})
    ex, _ = Examination.objects.get_or_create(
        name="Term 1 Assessment 2026",
        defaults={
            "exam_type": ex_type,
            "academic_year": year,
            "term": term,
            "start_date": date(2026, 3, 1),
            "end_date": date(2026, 3, 10),
            "status": "IN_PROGRESS"
        }
    )
    subj, _ = Subject.objects.get_or_create(name="Biology", code="BIO-101")
    cls, _ = Class.objects.get_or_create(name="Form 4A", code="F4A", defaults={"order": 4})
    ex_subj, _ = ExaminationSubject.objects.get_or_create(
        examination=ex,
        subject=subj,
        class_obj=cls,
        defaults={"exam_date": date(2026, 3, 5), "max_marks": 100.0, "pass_marks": 40.0}
    )
    
    student_user = User.objects.filter(email="test_student_hm@school.edu").first()
    if not student_user:
        student_user = User.objects.create_user(
            email="test_student_hm@school.edu",
            username="test_student_hm@school.edu",
            first_name="Samuel",
            last_name="Omondi",
            role=UserRole.STUDENT
        )
    student, _ = Student.objects.get_or_create(
        user=student_user,
        defaults={"admission_number": "ADM-HM-001", "current_class": cls}
    )

    test_res, _ = Result.objects.get_or_create(
        student=student,
        examination_subject=ex_subj,
        defaults={
            "marks_obtained": 86.5,
            "percentage": 86.5,
            "status": ResultStatus.VERIFIED
        }
    )
    test_res.status = ResultStatus.VERIFIED
    test_res.save()

    # Headmaster approves results
    transition_view = ResultViewSet.as_view({'post': 'workflow_transition'})
    req_approve = factory.post('/api/v1/results/workflow_transition/', {
        "action": "approve",
        "result_ids": [str(test_res.id)]
    }, format='json')
    force_authenticate(req_approve, user=hm_user)
    resp_approve = transition_view(req_approve)
    
    assert resp_approve.status_code == status.HTTP_200_OK, f"Expected 200 OK, got {resp_approve.status_code}: {resp_approve.data}"
    test_res.refresh_from_db()
    assert test_res.status == ResultStatus.APPROVED, f"Expected APPROVED, got {test_res.status}"
    assert test_res.approved_by == hm_user
    print(f"  ✓ Headmaster successfully APPROVED Result ID {test_res.id} (Status: {test_res.status})")

    # 5. Test Headmaster Official Announcement Creation
    print("\n--- Verifying Headmaster Announcement Broadcasting ---")
    announcement_view = AnnouncementViewSet.as_view({'post': 'create'})
    req_ann = factory.post('/api/v1/communication/announcements/', {
        "title": "Headmaster Executive Notice: Term 1 Final Examinations",
        "content": "All students and teachers must prepare for the final examinations starting next week.",
        "priority": "HIGH",
        "target_roles": "ALL"
    }, format='json')
    force_authenticate(req_ann, user=hm_user)
    resp_ann = announcement_view(req_ann)
    assert resp_ann.status_code == status.HTTP_201_CREATED, f"Expected 201 Created, got {resp_ann.status_code}"
    print(f"  ✓ Headmaster posted announcement: '{resp_ann.data['title']}' (ID: {resp_ann.data['id']})")

    print("\n" + "=" * 70)
    print("ALL HEADMASTER DASHBOARD VERIFICATIONS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_headmaster_verification()
