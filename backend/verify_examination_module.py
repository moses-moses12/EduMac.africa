import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from rest_framework.test import force_authenticate
from apps.accounts.models import User, UserRole
from apps.academics.models import AcademicYear, Term, Class, Subject
from apps.students.models import Student, StudentEnrollment
from apps.examinations.models import (
    Grade,
    Examination,
    ExaminationSubject,
    ExaminationType,
    ExaminationPeriod,
    ExaminationCandidate,
    ExamStatus
)
from apps.results.models import Result, ResultStatus, AttendanceStatus
from apps.examinations.views import ExaminationViewSet, ExaminationSubjectViewSet
from apps.results.views import ResultViewSet, StudentMyResultsView

def verify_examination_module():
    print("=" * 70)
    print("EXAMINATION MODULE END-TO-END VERIFICATION")
    print("=" * 70)

    factory = RequestFactory()
    admin_user = User.objects.filter(role=UserRole.ADMIN).first()
    teacher_user = User.objects.filter(role=UserRole.TEACHER).first()
    exam_officer = User.objects.filter(role=UserRole.EXAM_OFFICER).first()
    headmaster = User.objects.filter(role=UserRole.HEADMASTER).first()
    student_user = User.objects.filter(role=UserRole.STUDENT).first()

    # 1. Examination Types
    print("\n[1] Verifying Examination Types...")
    types_count = ExaminationType.objects.count()
    print(f"  -> Found {types_count} Examination Types in database:")
    for t in ExaminationType.objects.all():
        print(f"     * {t.code}: {t.name} (Weightage: {t.default_weightage}%)")
    assert types_count >= 5, "Expected at least 5 examination types"

    # 2. Examination Periods
    print("\n[2] Verifying Examination Periods...")
    periods_count = ExaminationPeriod.objects.count()
    print(f"  -> Found {periods_count} Examination Periods:")
    for p in ExaminationPeriod.objects.all():
        print(f"     * {p.name} [{p.start_date} to {p.end_date}]")
    assert periods_count >= 1, "Expected at least 1 examination period"

    # 3. Examination & Schedule
    print("\n[3] Verifying Examination Schedule & Subjects...")
    exams = Examination.objects.all()
    print(f"  -> Total Examinations: {exams.count()}")
    for exam in exams:
        sub_count = exam.exam_subjects.count()
        cand_count = exam.candidates.count()
        print(f"     * '{exam.name}' [{exam.get_exam_type_display()}] - {sub_count} papers, {cand_count} candidates, Published: {exam.is_published}")

    sample_sub = ExaminationSubject.objects.first()
    print(f"  -> Sample paper: {sample_sub.subject.code} {sample_sub.subject.name} - Max: {sample_sub.max_marks}, Pass: {sample_sub.pass_marks}")
    assert sample_sub.max_marks > 0, "Max marks must be greater than zero"
    assert sample_sub.pass_marks > 0, "Pass marks must be greater than zero"

    # 4. Timetable Clash Detection
    print("\n[4] Verifying Timetable Clash Detection API...")
    clash_view = ExaminationSubjectViewSet.as_view({'get': 'clashes'})
    req = factory.get('/api/v1/examinations/subjects/clashes/')
    force_authenticate(req, user=admin_user)
    resp = clash_view(req)
    print(f"  -> Clash check status: {resp.status_code}, Has clashes: {resp.data['has_clashes']}, Total: {resp.data['total_clashes']}")

    # 5. Candidate Roll & Indexing
    print("\n[5] Verifying Candidates Roll & Index Numbers...")
    candidates = ExaminationCandidate.objects.all()
    print(f"  -> Total Candidates in database: {candidates.count()}")
    for c in candidates[:3]:
        print(f"     * {c.index_number}: {c.student.admission_number} - {c.student.user.get_full_name()} [{c.eligibility_status}, Fee: {c.fee_clearance}]")

    # 6. Marks Entry Bounds Validation
    print("\n[6] Verifying Marks Entry Bounds Validation...")
    student = Student.objects.filter(user=student_user).first() or Student.objects.first()
    max_m = sample_sub.max_marks

    # Invalid marks: 150 > max_marks
    bulk_view = ResultViewSet.as_view({'post': 'bulk_entry'})
    req_invalid = factory.post('/api/v1/results/bulk_entry/', {
        'examination_subject_id': str(sample_sub.id),
        'target_status': 'DRAFT',
        'results': [{'student_id': str(student.id), 'marks_obtained': 150.0}]
    }, content_type='application/json')
    force_authenticate(req_invalid, user=teacher_user or admin_user)
    resp_inv = bulk_view(req_invalid)
    print(f"  -> Over max_marks rejection status: {resp_inv.status_code}")
    assert resp_inv.status_code == 400 or resp_inv.status_code == 207, "Expected rejection for marks > max_marks"
    print("     [PASS] Correctly rejected score exceeding max marks")

    # Valid score entry
    req_valid = factory.post('/api/v1/results/bulk_entry/', {
        'examination_subject_id': str(sample_sub.id),
        'target_status': 'DRAFT',
        'results': [{'student_id': str(student.id), 'marks_obtained': 86.5, 'remarks': 'Exemplary performance'}]
    }, content_type='application/json')
    force_authenticate(req_valid, user=teacher_user or admin_user)
    resp_val = bulk_view(req_valid)
    print(f"  -> Valid score entry status: {resp_val.status_code}, Saved: {resp_val.data.get('saved_count')}")

    # 7. Result & Grade Calculation
    print("\n[7] Verifying Result & Grade Calculation...")
    res = Result.objects.get(examination_subject=sample_sub, student=student)
    print(f"  -> Marks Obtained: {res.marks_obtained} / {sample_sub.max_marks}")
    print(f"  -> Calculated Percentage: {res.percentage}%")
    print(f"  -> Is Passed: {res.is_passed} (Pass mark: {sample_sub.pass_marks})")
    print(f"  -> Assigned Grade: {res.grade.name} ({res.grade.remark})")
    print(f"  -> Grade Point: {res.grade.grade_point}")
    print(f"  -> Current Status: {res.status}")
    assert res.percentage == Decimal('86.50'), "Percentage calculation mismatch"
    assert res.is_passed is True, "Expected is_passed to be True"
    assert res.grade is not None, "Grade should be calculated and assigned"

    # 8. Result Lifecycle Workflow Progression
    print("\n[8] Verifying Multi-Tier Approval Workflow...")
    transition_view = ResultViewSet.as_view({'post': 'workflow_transition'})

    # Step 1: SUBMIT (DRAFT -> SUBMITTED)
    req_sub = factory.post('/api/v1/results/workflow_transition/', {
        'examination_subject_id': str(sample_sub.id),
        'action': 'submit'
    }, content_type='application/json')
    force_authenticate(req_sub, user=teacher_user or admin_user)
    resp_sub = transition_view(req_sub)
    res.refresh_from_db()
    print(f"  -> Step 1 SUBMIT: {resp_sub.data.get('action')} -> New Status: {res.status}")
    assert res.status == ResultStatus.SUBMITTED

    # Step 2: VERIFY (SUBMITTED -> VERIFIED)
    req_ver = factory.post('/api/v1/results/workflow_transition/', {
        'examination_subject_id': str(sample_sub.id),
        'action': 'verify'
    }, content_type='application/json')
    force_authenticate(req_ver, user=exam_officer or admin_user)
    resp_ver = transition_view(req_ver)
    res.refresh_from_db()
    print(f"  -> Step 2 VERIFY: {resp_ver.data.get('action')} -> New Status: {res.status}")
    assert res.status == ResultStatus.VERIFIED

    # Step 3: APPROVE (VERIFIED -> APPROVED)
    req_app = factory.post('/api/v1/results/workflow_transition/', {
        'examination_subject_id': str(sample_sub.id),
        'action': 'approve'
    }, content_type='application/json')
    force_authenticate(req_app, user=headmaster or admin_user)
    resp_app = transition_view(req_app)
    res.refresh_from_db()
    print(f"  -> Step 3 APPROVE: {resp_app.data.get('action')} -> New Status: {res.status}")
    assert res.status == ResultStatus.APPROVED

    # Step 4: Revert Test (APPROVED -> DRAFT with Reason)
    req_rev = factory.post('/api/v1/results/workflow_transition/', {
        'examination_subject_id': str(sample_sub.id),
        'action': 'revert',
        'reason': 'Audit test variance'
    }, content_type='application/json')
    force_authenticate(req_rev, user=admin_user)
    resp_rev = transition_view(req_rev)
    res.refresh_from_db()
    print(f"  -> Step 4 REVERT: {resp_rev.data.get('action')} -> Reverted to Status: {res.status}, Reason: '{res.revert_reason}'")
    assert res.status == ResultStatus.DRAFT

    # Move back through to APPROVED then PUBLISHED
    res.transition_to(ResultStatus.SUBMITTED, admin_user)
    res.transition_to(ResultStatus.VERIFIED, admin_user)
    res.transition_to(ResultStatus.APPROVED, admin_user)

    # 9. Publication Workflow
    print("\n[9] Verifying Publication Workflow...")
    req_pub = factory.post('/api/v1/results/workflow_transition/', {
        'examination_subject_id': str(sample_sub.id),
        'action': 'publish'
    }, content_type='application/json')
    force_authenticate(req_pub, user=exam_officer or admin_user)
    resp_pub = transition_view(req_pub)
    res.refresh_from_db()
    print(f"  -> Step 5 PUBLISH: {resp_pub.data.get('action')} -> New Status: {res.status}")
    assert res.status == ResultStatus.PUBLISHED

    # 10. CRITICAL SECURITY SPECIFICATION: Student Visibility
    print("\n[10] Verifying Student Visibility Security Requirement...")
    print("     RULE: Students can ONLY see PUBLISHED results.")
    
    # Check student access to PUBLISHED result
    my_results_view = StudentMyResultsView.as_view()
    req_student = factory.get('/api/v1/results/me/')
    force_authenticate(req_student, user=student.user)
    resp_student_pub = my_results_view(req_student)
    print(f"  -> Student views results when status is PUBLISHED: {resp_student_pub.status_code}")
    print(f"     Total subjects visible: {resp_student_pub.data['summary']['total_subjects']}")
    assert resp_student_pub.data['summary']['total_subjects'] >= 1, "Published results should be visible"

    # Temporarily set to SUBMITTED to test invisibility
    res.status = ResultStatus.SUBMITTED
    res.save()
    req_student2 = factory.get('/api/v1/results/me/')
    force_authenticate(req_student2, user=student.user)
    resp_student_sub = my_results_view(req_student2)
    print(f"  -> Student views results when status is SUBMITTED:")
    print(f"     Total subjects visible: {resp_student_sub.data['summary']['total_subjects']}")
    assert resp_student_sub.data['summary']['total_subjects'] == 0, "UNPUBLISHED results MUST NOT be visible to student"
    print("     [SECURITY CERTIFIED] Unpublished marks are strictly blocked from students.")

    # Restore to PUBLISHED
    res.status = ResultStatus.PUBLISHED
    res.save()

    print("\n" + "=" * 70)
    print("ALL EXAMINATION MODULE SPECIFICATIONS VERIFIED & PASSING!")
    print("=" * 70)

if __name__ == '__main__':
    verify_examination_module()
