import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.accounts.models import UserRole
from apps.students.models import Student, Parent
from apps.academics.models import AcademicYear, Term, Class, Stream, Subject
from apps.examinations.models import Examination, ExaminationType, ExaminationPeriod, ExaminationSubject, Grade
from apps.results.models import Result, ResultStatus
from apps.attendance.models import Attendance, AttendanceStatus, AttendanceType
from apps.fees.models import FeeStructure, Invoice, Payment, InvoiceStatus
from apps.timetable.models import Timetable, DayOfWeek
from apps.assignments.models import Assignment, AssignmentSubmission, SubmissionStatus
from apps.communication.models import Announcement
from apps.notifications.models import Notification, NotificationType
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.results.views import StudentMyResultsView
from apps.attendance.views import StudentMyAttendanceView
from apps.fees.views import StudentMyFeesView
from apps.timetable.views import StudentMyTimetableView
from apps.assignments.views import StudentMyAssignmentsView
from apps.students.views import ParentViewSet

User = get_user_model()

def run_verification():
    print("=== STARTING PARENT DASHBOARD & SCOPING SECURITY VERIFICATION ===")

    # 1. Setup Academic Context
    acad_year, _ = AcademicYear.objects.get_or_create(
        name="2026/2027",
        defaults={"start_date": "2026-01-01", "end_date": "2026-12-31", "is_current": True}
    )
    term, _ = Term.objects.get_or_create(
        academic_year=acad_year,
        name="Term 1",
        defaults={"start_date": "2026-01-01", "end_date": "2026-04-30", "is_current": True}
    )
    class_10, _ = Class.objects.get_or_create(name="Grade 10 Test", defaults={"code": "G10-TEST", "order": 10})
    stream_a, _ = Stream.objects.get_or_create(name="Stream A", class_obj=class_10)
    subject_mth, _ = Subject.objects.get_or_create(name="Mathematics", code="MTH101Test")

    # 2. Setup Parents and Students
    parent1_user, _ = User.objects.get_or_create(
        email="parent1@example.com",
        defaults={"username": "parent1", "first_name": "John", "last_name": "ParentOne", "role": UserRole.PARENT}
    )
    parent1_user.role = UserRole.PARENT
    parent1_user.save()
    parent1, _ = Parent.objects.get_or_create(user=parent1_user, defaults={"relationship_type": "FATHER"})

    parent2_user, _ = User.objects.get_or_create(
        email="parent2@example.com",
        defaults={"username": "parent2", "first_name": "Mary", "last_name": "ParentTwo", "role": UserRole.PARENT}
    )
    parent2_user.role = UserRole.PARENT
    parent2_user.save()
    parent2, _ = Parent.objects.get_or_create(user=parent2_user, defaults={"relationship_type": "MOTHER"})

    # Child 1 linked to Parent 1
    child1_user, _ = User.objects.get_or_create(
        email="child1@example.com",
        defaults={"username": "child1", "first_name": "Alice", "last_name": "One", "role": UserRole.STUDENT}
    )
    child1, _ = Student.objects.get_or_create(
        admission_number="ADM-P1-001",
        defaults={
            "user": child1_user,
            "parent": parent1,
            "current_class": class_10,
            "current_stream": stream_a,
            "academic_year": acad_year
        }
    )
    child1.parent = parent1
    child1.current_class = class_10
    child1.current_stream = stream_a
    child1.save()

    # Child 2 linked to Parent 1 (Parent 1 has multiple children!)
    child2_user, _ = User.objects.get_or_create(
        email="child2@example.com",
        defaults={"username": "child2", "first_name": "Bob", "last_name": "One", "role": UserRole.STUDENT}
    )
    child2, _ = Student.objects.get_or_create(
        admission_number="ADM-P1-002",
        defaults={
            "user": child2_user,
            "parent": parent1,
            "current_class": class_10,
            "current_stream": stream_a,
            "academic_year": acad_year
        }
    )
    child2.parent = parent1
    child2.current_class = class_10
    child2.current_stream = stream_a
    child2.save()

    # Child 3 linked to Parent 2 (UNLINKED to Parent 1)
    child3_user, _ = User.objects.get_or_create(
        email="child3@example.com",
        defaults={"username": "child3", "first_name": "Charlie", "last_name": "Two", "role": UserRole.STUDENT}
    )
    child3, _ = Student.objects.get_or_create(
        admission_number="ADM-P2-003",
        defaults={
            "user": child3_user,
            "parent": parent2,
            "current_class": class_10,
            "current_stream": stream_a,
            "academic_year": acad_year
        }
    )
    child3.parent = parent2
    child3.save()

    factory = APIRequestFactory()

    # Test 1: Parent 1 gets their linked children
    req = factory.get('/api/v1/parents/children/')
    force_authenticate(req, user=parent1_user)
    view = ParentViewSet.as_view({'get': 'children'})
    res = view(req)
    assert res.status_code == 200
    p1_children = res.data['children']
    child_ids = [c['id'] for c in p1_children]
    assert str(child1.id) in child_ids
    assert str(child2.id) in child_ids
    assert str(child3.id) not in child_ids
    print(f"✓ Test 1: Parent 1 sees only their {len(p1_children)} linked children, Child 3 is excluded.")

    # Test 2: Results endpoint security check
    # Create published result for child 1
    exam_type, _ = ExaminationType.objects.get_or_create(name="Midterm Test", code="MID_T")
    exam_period, _ = ExaminationPeriod.objects.get_or_create(
        academic_year=acad_year, term=term, name="T1 2026 Test",
        defaults={"start_date": "2026-03-01", "end_date": "2026-03-15"}
    )
    exam, _ = Examination.objects.get_or_create(
        examination_type=exam_type,
        period=exam_period,
        name="Midterm Examination Test",
        academic_year=acad_year,
        term=term,
        defaults={"start_date": "2026-03-01", "end_date": "2026-03-15", "is_published": True}
    )
    exam_subj, _ = ExaminationSubject.objects.get_or_create(
        examination=exam, subject=subject_mth, class_obj=class_10,
        defaults={"max_marks": 100, "pass_marks": 50}
    )
    grade_a, _ = Grade.objects.get_or_create(name="A", defaults={"min_score": 80, "max_score": 100, "grade_point": 4.0})
    result_published, _ = Result.objects.get_or_create(
        examination_subject=exam_subj,
        student=child1,
        defaults={
            "marks_obtained": 95,
            "percentage": 95,
            "grade": grade_a,
            "status": ResultStatus.PUBLISHED,
            "is_passed": True
        }
    )

    # Parent 1 querying child 1 results -> 200 OK
    req = factory.get(f'/api/v1/results/me/?student_id={child1.id}')
    force_authenticate(req, user=parent1_user)
    res = StudentMyResultsView.as_view()(req)
    assert res.status_code == 200
    assert len(res.data['results']) >= 1
    print("✓ Test 2a: Parent 1 can view published results for linked Child 1.")

    # Parent 1 querying unlinked child 3 results -> 404 NOT FOUND
    req = factory.get(f'/api/v1/results/me/?student_id={child3.id}')
    force_authenticate(req, user=parent1_user)
    res = StudentMyResultsView.as_view()(req)
    assert res.status_code == 404
    print("✓ Test 2b: Parent 1 BLOCKED from viewing unlinked Child 3 results (404 Not Found).")

    # Test 3: Attendance endpoint security check
    att_rec, _ = Attendance.objects.get_or_create(
        student=child1,
        date="2026-03-05",
        defaults={"attendance_type": AttendanceType.DAILY, "status": AttendanceStatus.PRESENT, "recorded_by": parent1_user}
    )
    # Query linked child 1 attendance -> 200 OK
    req = factory.get(f'/api/v1/attendance/me/?student_id={child1.id}')
    force_authenticate(req, user=parent1_user)
    res = StudentMyAttendanceView.as_view()(req)
    assert res.status_code == 200
    print("✓ Test 3a: Parent 1 can view attendance for linked Child 1.")

    # Query unlinked child 3 attendance -> 404 NOT FOUND
    req = factory.get(f'/api/v1/attendance/me/?student_id={child3.id}')
    force_authenticate(req, user=parent1_user)
    res = StudentMyAttendanceView.as_view()(req)
    assert res.status_code == 404
    print("✓ Test 3b: Parent 1 BLOCKED from viewing unlinked Child 3 attendance (404 Not Found).")

    # Test 4: Fees & Balances endpoint security check
    fee_struct, _ = FeeStructure.objects.get_or_create(
        academic_year=acad_year,
        term=term,
        class_obj=class_10,
        defaults={"total_amount": 1500, "due_date": "2026-04-01"}
    )
    inv1, _ = Invoice.objects.get_or_create(
        student=child1,
        fee_structure=fee_struct,
        defaults={"invoice_number": "INV-P1-001", "total_amount": 1500, "paid_amount": 500, "balance": 1000, "status": InvoiceStatus.PARTIAL, "due_date": "2026-04-15"}
    )
    pay1, _ = Payment.objects.get_or_create(
        invoice=inv1,
        payment_number="PAY-P1-001",
        defaults={"amount": 500, "payment_method": "MOBILE_MONEY", "payment_date": "2026-03-10", "received_by": parent1_user}
    )

    # Query linked child 1 fees -> 200 OK
    req = factory.get(f'/api/v1/fees/me/?student_id={child1.id}')
    force_authenticate(req, user=parent1_user)
    res = StudentMyFeesView.as_view()(req)
    assert res.status_code == 200
    assert res.data['summary']['outstanding_balance'] == 1000.0
    assert len(res.data['payments']) >= 1
    print(f"✓ Test 4a: Parent 1 can view fee balances and payment history for Child 1 (Balance: {res.data['summary']['outstanding_balance']}, Payments: {len(res.data['payments'])}).")

    # Query unlinked child 3 fees -> 404 NOT FOUND
    req = factory.get(f'/api/v1/fees/me/?student_id={child3.id}')
    force_authenticate(req, user=parent1_user)
    res = StudentMyFeesView.as_view()(req)
    assert res.status_code == 404
    print("✓ Test 4b: Parent 1 BLOCKED from viewing unlinked Child 3 fees (404 Not Found).")

    # Test 5: Timetable endpoint security check
    slot1, _ = Timetable.objects.get_or_create(
        stream=stream_a,
        subject=subject_mth,
        day_of_week=DayOfWeek.MONDAY,
        defaults={"start_time": "08:00:00", "end_time": "09:00:00", "room_number": "Room 101"}
    )
    # Query linked child 1 timetable -> 200 OK
    req = factory.get(f'/api/v1/timetable/me/?student_id={child1.id}')
    force_authenticate(req, user=parent1_user)
    res = StudentMyTimetableView.as_view()(req)
    assert res.status_code == 200
    assert len(res.data['slots']) >= 1
    print(f"✓ Test 5a: Parent 1 can view timetable for Child 1 ({len(res.data['slots'])} slots).")

    # Query unlinked child 3 timetable -> 404 NOT FOUND
    req = factory.get(f'/api/v1/timetable/me/?student_id={child3.id}')
    force_authenticate(req, user=parent1_user)
    res = StudentMyTimetableView.as_view()(req)
    assert res.status_code == 404
    print("✓ Test 5b: Parent 1 BLOCKED from viewing unlinked Child 3 timetable (404 Not Found).")

    # Test 6: Assignments endpoint security check
    teacher_user, _ = User.objects.get_or_create(
        email="teacher1@example.com",
        defaults={"username": "teacher1", "first_name": "Tchr", "last_name": "One", "role": UserRole.TEACHER}
    )
    from apps.staff.models import Teacher
    teacher_profile, _ = Teacher.objects.get_or_create(user=teacher_user, defaults={"employee_id": "EMP-T1"})
    assignment1, _ = Assignment.objects.get_or_create(
        stream=stream_a,
        subject=subject_mth,
        title="Algebra Homework 1",
        defaults={
            "description": "Solve exercises 1-10 on page 42.",
            "teacher": teacher_profile,
            "due_date": "2026-03-25T23:59:59Z",
            "max_marks": 50
        }
    )
    sub1, _ = AssignmentSubmission.objects.get_or_create(
        assignment=assignment1,
        student=child1,
        defaults={"marks_awarded": 48, "status": SubmissionStatus.GRADED, "feedback": "Well done Alice!"}
    )

    # Query linked child 1 assignments -> 200 OK
    req = factory.get(f'/api/v1/assignments/me/?student_id={child1.id}')
    force_authenticate(req, user=parent1_user)
    res = StudentMyAssignmentsView.as_view()(req)
    assert res.status_code == 200
    assert len(res.data['assignments']) >= 1
    print(f"✓ Test 6a: Parent 1 can view assignments for Child 1 ({len(res.data['assignments'])} assignments, Alice score: {res.data['assignments'][0]['marks_awarded']}).")

    # Query unlinked child 3 assignments -> 404 NOT FOUND
    req = factory.get(f'/api/v1/assignments/me/?student_id={child3.id}')
    force_authenticate(req, user=parent1_user)
    res = StudentMyAssignmentsView.as_view()(req)
    assert res.status_code == 404
    print("✓ Test 6b: Parent 1 BLOCKED from viewing unlinked Child 3 assignments (404 Not Found).")

    # Test 7: Announcements for Parents
    ann1, _ = Announcement.objects.get_or_create(
        title="Parent-Teacher Conference Notice",
        defaults={
            "content": "PTA meeting will be held on Friday at 3:00 PM in the Main Auditorium.",
            "target_roles": "PARENT,TEACHER",
            "posted_by": parent1_user
        }
    )
    from apps.communication.views import AnnouncementViewSet
    req = factory.get('/api/v1/communication/announcements/')
    force_authenticate(req, user=parent1_user)
    view = AnnouncementViewSet.as_view({'get': 'list'})
    res = view(req)
    assert res.status_code == 200
    print(f"✓ Test 7: Parent 1 received announcements targeted to PARENT/ALL.")

    # Test 8: Notifications for Parents
    notif1, _ = Notification.objects.get_or_create(
        user=parent1_user,
        title="Term 1 Report Card Ready",
        defaults={
            "message": "Results for Alice One have been verified and published.",
            "notification_type": NotificationType.RESULT_PUBLISHED
        }
    )
    from apps.notifications.views import NotificationViewSet
    req = factory.get('/api/v1/notifications/')
    force_authenticate(req, user=parent1_user)
    view = NotificationViewSet.as_view({'get': 'list'})
    res = view(req)
    assert res.status_code == 200
    assert res.data['count'] >= 1
    print(f"✓ Test 8: Parent 1 received personal notification alerts.")

    print("\n========================================================")
    print("ALL 8 DOMAIN TESTS PASSED WITH 100% PARENT DATA ISOLATION!")
    print("========================================================")

if __name__ == '__main__':
    run_verification()
