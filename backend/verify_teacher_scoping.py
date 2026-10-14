import os
import django
from decimal import Decimal
from datetime import date, time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.exceptions import PermissionDenied
from apps.accounts.models import User, UserRole
from apps.accounts.views import UserViewSet
from apps.staff.models import Teacher
from apps.staff.views import TeacherViewSet
from apps.academics.models import AcademicYear, Term, Class, Stream, Subject, TeacherAssignment
from apps.students.models import Student, StudentEnrollment
from apps.students.views import StudentViewSet
from apps.attendance.models import Attendance, AttendanceStatus, AttendanceType
from apps.attendance.views import AttendanceViewSet
from apps.examinations.models import Examination, ExaminationType, ExaminationSubject, ExamStatus
from apps.examinations.views import ExaminationSubjectViewSet, ExaminationCandidateViewSet
from apps.results.models import Result, ResultStatus, Grade
from apps.results.views import ResultViewSet
from apps.assignments.models import Assignment
from apps.assignments.views import AssignmentViewSet
from apps.timetable.models import Timetable
from apps.timetable.views import TimetableViewSet
from apps.fees.views import FeeStructureViewSet

def run_tests():
    factory = APIRequestFactory()

    print("=== STARTING TEACHER DASHBOARD RBAC & SCOPING VERIFICATION ===")

    # Setup Academic Structure
    ay, _ = AcademicYear.objects.get_or_create(name="2026-TeacherTest", defaults={"start_date": "2026-01-01", "end_date": "2026-12-31", "is_current": True})
    term, _ = Term.objects.get_or_create(academic_year=ay, name="Term 1", defaults={"start_date": "2026-01-05", "end_date": "2026-04-10", "is_current": True})

    class_a, _ = Class.objects.get_or_create(name="Grade 10-A", defaults={"code": "G10A", "order": 10})
    class_b, _ = Class.objects.get_or_create(name="Grade 12-Unrelated", defaults={"code": "G12U", "order": 12})

    stream_a, _ = Stream.objects.get_or_create(class_obj=class_a, name="Stream Alpha")
    stream_b, _ = Stream.objects.get_or_create(class_obj=class_b, name="Stream Beta")

    sub_math, _ = Subject.objects.get_or_create(code="MATH-10", defaults={"name": "Mathematics 10", "department": "Science"})
    sub_hist, _ = Subject.objects.get_or_create(code="HIST-12", defaults={"name": "History 12", "department": "Humanities"})

    # Create Teacher User & Profile
    teacher_user, _ = User.objects.get_or_create(
        email="teacher.test@apexschool.edu",
        defaults={"username": "teacher.test", "first_name": "Sarah", "last_name": "Jenkins", "role": UserRole.TEACHER}
    )
    teacher_user.role = UserRole.TEACHER
    teacher_user.save()

    teacher_prof, _ = Teacher.objects.get_or_create(
        user=teacher_user,
        defaults={"employee_id": "TCH-9901", "specialization": "Mathematics"}
    )

    # Assign Teacher ONLY to Class A, Stream Alpha, Math
    assignment, _ = TeacherAssignment.objects.get_or_create(
        teacher=teacher_prof,
        subject=sub_math,
        class_obj=class_a,
        stream=stream_a,
        academic_year=ay,
        term=term,
        defaults={"is_class_teacher": True, "periods_per_week": 5}
    )

    # Create Student in Class A (Assigned)
    stu_user_a, _ = User.objects.get_or_create(
        email="stu.a@apexschool.edu",
        defaults={"username": "stu.a", "first_name": "Alice", "last_name": "Alpha", "role": UserRole.STUDENT}
    )
    student_a, _ = Student.objects.get_or_create(
        user=stu_user_a,
        admission_number="ADM-A001",
        defaults={"current_class": class_a, "current_stream": stream_a, "academic_year": ay}
    )
    student_a.current_class = class_a
    student_a.current_stream = stream_a
    student_a.save()

    # Create Student in Class B (Unrelated)
    stu_user_b, _ = User.objects.get_or_create(
        email="stu.b@apexschool.edu",
        defaults={"username": "stu.b", "first_name": "Bob", "last_name": "Beta", "role": UserRole.STUDENT}
    )
    student_b, _ = Student.objects.get_or_create(
        user=stu_user_b,
        admission_number="ADM-B001",
        defaults={"current_class": class_b, "current_stream": stream_b, "academic_year": ay}
    )
    student_b.current_class = class_b
    student_b.current_stream = stream_b
    student_b.save()

    # 1. TEST: Teacher can view assigned students, CANNOT view unrelated students
    req = factory.get('/api/v1/students/')
    force_authenticate(req, user=teacher_user)
    view = StudentViewSet.as_view({'get': 'list'})
    resp = view(req)
    student_ids = [s['id'] for s in resp.data.get('results', resp.data if isinstance(resp.data, list) else [])]
    assert str(student_a.id) in student_ids, "Teacher should see student in assigned class"
    assert str(student_b.id) not in student_ids, "Teacher MUST NOT see student in unrelated class"
    print("PASS 1: Student scoping verified (Assigned visible, Unrelated hidden)")

    # 2. TEST: Teacher endpoint /api/v1/staff/teachers/me/
    req = factory.get('/api/v1/staff/teachers/me/')
    force_authenticate(req, user=teacher_user)
    view = TeacherViewSet.as_view({'get': 'me'})
    resp = view(req)
    assert resp.status_code == 200, f"Failed teacher me endpoint: {resp.data}"
    assert len(resp.data['classes']) >= 1, "Teacher should receive assigned classes"
    assert resp.data['classes'][0]['id'] == str(class_a.id)
    print("PASS 2: Teacher profile 'me' returns assigned classes, streams, and subjects")

    # 3. TEST: Attendance bulk_mark - assigned vs unrelated
    req = factory.post('/api/v1/attendance/records/bulk_mark/', {
        "date": "2026-10-13",
        "stream_id": str(stream_a.id),
        "attendance_type": "DAILY",
        "records": [{"student_id": str(student_a.id), "status": "PRESENT"}]
    }, format='json')
    force_authenticate(req, user=teacher_user)
    view = AttendanceViewSet.as_view({'post': 'bulk_mark'})
    resp = view(req)
    assert resp.status_code == 200, f"Teacher should mark attendance for assigned stream: {resp.data}"

    # Try marking for unrelated stream_b
    req_unrelated = factory.post('/api/v1/attendance/records/bulk_mark/', {
        "date": "2026-10-13",
        "stream_id": str(stream_b.id),
        "attendance_type": "DAILY",
        "records": [{"student_id": str(student_b.id), "status": "PRESENT"}]
    }, format='json')
    force_authenticate(req_unrelated, user=teacher_user)
    resp_unrelated = view(req_unrelated)
    assert resp_unrelated.status_code == 403, f"Teacher marking unrelated stream should be 403: {resp_unrelated.data}"
    print("PASS 3: Attendance bulk_mark authorization verified (Assigned: 200, Unrelated: 403)")

    # 4. TEST: Examination and Marks entry
    exam_type, _ = ExaminationType.objects.get_or_create(code="MID", defaults={"name": "Mid-Term Exam"})
    exam, _ = Examination.objects.get_or_create(
        name="Mid-Term 2026",
        academic_year=ay,
        term=term,
        examination_type=exam_type,
        defaults={
            "status": ExamStatus.ONGOING,
            "is_published": False,
            "start_date": date(2026, 10, 10),
            "end_date": date(2026, 10, 20)
        }
    )
    exam_sub_a, _ = ExaminationSubject.objects.get_or_create(
        examination=exam,
        subject=sub_math,
        class_obj=class_a,
        defaults={"max_marks": Decimal('100.00'), "pass_marks": Decimal('50.00'), "exam_date": date(2026, 10, 15)}
    )
    exam_sub_b, _ = ExaminationSubject.objects.get_or_create(
        examination=exam,
        subject=sub_hist,
        class_obj=class_b,
        defaults={"max_marks": Decimal('100.00'), "pass_marks": Decimal('50.00'), "exam_date": date(2026, 10, 15)}
    )

    # Clean up previous test results
    Result.objects.filter(examination_subject__in=[exam_sub_a, exam_sub_b]).delete()

    # Teacher entering marks for assigned exam_sub_a (Math 10-A)
    req = factory.post('/api/v1/results/records/bulk_entry/', {
        "examination_subject_id": str(exam_sub_a.id),
        "target_status": "DRAFT",
        "results": [{"student_id": str(student_a.id), "marks_obtained": "85.00", "remarks": "Excellent"}]
    }, format='json')
    force_authenticate(req, user=teacher_user)
    view = ResultViewSet.as_view({'post': 'bulk_entry'})
    resp = view(req)
    assert resp.status_code == 200, f"Teacher should enter marks for assigned subject: {resp.data}"

    # Teacher entering marks for unrelated exam_sub_b (History 12-U)
    req_unrelated = factory.post('/api/v1/results/records/bulk_entry/', {
        "examination_subject_id": str(exam_sub_b.id),
        "target_status": "DRAFT",
        "results": [{"student_id": str(student_b.id), "marks_obtained": "70.00"}]
    }, format='json')
    force_authenticate(req_unrelated, user=teacher_user)
    resp_unrelated = view(req_unrelated)
    assert resp_unrelated.status_code == 403, f"Teacher entering marks for unrelated subject should be 403: {resp_unrelated.data}"
    print("PASS 4: Marks entry authorization verified (Assigned: 200, Unrelated: 403)")

    # 5. TEST: Teacher CANNOT modify or delete results locked in SUBMITTED/APPROVED/PUBLISHED
    res_draft = Result.objects.get(examination_subject=exam_sub_a, student=student_a)
    # Transition to PUBLISHED for test
    res_draft.status = ResultStatus.PUBLISHED
    res_draft.save()

    # Try direct PATCH on published result by teacher
    req = factory.patch(f'/api/v1/results/records/{res_draft.id}/', {"marks_obtained": "99.00"}, format='json')
    force_authenticate(req, user=teacher_user)
    view = ResultViewSet.as_view({'patch': 'partial_update'})
    try:
        resp = view(req, pk=str(res_draft.id))
        assert resp.status_code == 403, f"Should reject direct edit of published result: {resp.status_code}"
    except PermissionDenied:
        pass # DRF raised PermissionDenied directly, which is correct

    # Try direct DELETE on published result by teacher
    req = factory.delete(f'/api/v1/results/records/{res_draft.id}/')
    force_authenticate(req, user=teacher_user)
    view = ResultViewSet.as_view({'delete': 'destroy'})
    try:
        resp = view(req, pk=str(res_draft.id))
        assert resp.status_code == 403, f"Should reject direct delete of published result: {resp.status_code}"
    except PermissionDenied:
        pass # DRF raised PermissionDenied directly, which is correct
    print("PASS 5: Direct edit/deletion of published results strictly rejected for teachers")

    # 6. TEST: Assignment creation - assigned vs unrelated
    req = factory.post('/api/v1/assignments/tasks/', {
        "title": "Algebra Homework 1",
        "description": "Solve exercises 1 to 10 on page 42.",
        "stream": str(stream_a.id),
        "subject": str(sub_math.id),
        "total_marks": 20,
        "due_date": "2026-10-20T18:00:00Z"
    }, format='json')
    force_authenticate(req, user=teacher_user)
    view = AssignmentViewSet.as_view({'post': 'create'})
    resp = view(req)
    assert resp.status_code == 201, f"Teacher should create assignment for assigned class/subject: {resp.data}"

    # Try creating assignment for unrelated stream_b / sub_hist
    req_unrelated = factory.post('/api/v1/assignments/tasks/', {
        "title": "History Essay",
        "description": "Write 500 words on ancient civilizations.",
        "stream": str(stream_b.id),
        "subject": str(sub_hist.id),
        "total_marks": 50,
        "due_date": "2026-10-20T18:00:00Z"
    }, format='json')
    force_authenticate(req_unrelated, user=teacher_user)
    try:
        resp_unrelated = view(req_unrelated)
        assert resp_unrelated.status_code == 403, f"Unrelated assignment creation should be 403: {resp_unrelated.data}"
    except PermissionDenied:
        pass
    print("PASS 6: Assignment creation authorization verified (Assigned: 201, Unrelated: 403)")

    # 7. TEST: Timetable - teacher cannot view unrelated classes
    tt_assigned, _ = Timetable.objects.get_or_create(
        stream=stream_a,
        day_of_week=0,
        start_time=time(8, 0),
        end_time=time(9, 0),
        defaults={"subject": sub_math, "teacher": teacher_prof}
    )
    tt_unrelated, _ = Timetable.objects.get_or_create(
        stream=stream_b,
        day_of_week=0,
        start_time=time(10, 0),
        end_time=time(11, 0),
        defaults={"subject": sub_hist}
    )
    req = factory.get('/api/v1/timetable/slots/')
    force_authenticate(req, user=teacher_user)
    view = TimetableViewSet.as_view({'get': 'list'})
    resp = view(req)
    slot_ids = [s['id'] for s in resp.data.get('results', resp.data if isinstance(resp.data, list) else [])]
    assert str(tt_assigned.id) in slot_ids, "Teacher should see their assigned timetable slot"
    assert str(tt_unrelated.id) not in slot_ids, "Teacher MUST NOT see unrelated timetable slot"
    print("PASS 7: Timetable scoping verified (Assigned visible, Unrelated hidden)")

    # 8. TEST: Teacher CANNOT manage users or change roles
    req = factory.get('/api/v1/accounts/users/')
    force_authenticate(req, user=teacher_user)
    view = UserViewSet.as_view({'get': 'list'})
    resp = view(req)
    assert resp.status_code == 403, f"Teacher managing users should return 403: {resp.status_code}"
    print("PASS 8: Teacher blocked from managing users (403 Forbidden)")

    # 9. TEST: Teacher CANNOT modify finance configuration
    req = factory.post('/api/v1/fees/structures/', {"name": "Hacked Fee"}, format='json')
    force_authenticate(req, user=teacher_user)
    view = FeeStructureViewSet.as_view({'post': 'create'})
    resp = view(req)
    assert resp.status_code == 403, f"Teacher modifying finance should return 403: {resp.status_code}"
    print("PASS 9: Teacher blocked from modifying finance configuration (403 Forbidden)")

    print("\nALL 9 TEACHER DASHBOARD RBAC & SCOPING TESTS PASSED COMPLETELY!")

if __name__ == '__main__':
    run_tests()
