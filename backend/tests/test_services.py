import pytest
from decimal import Decimal
from rest_framework.test import APIClient
from apps.accounts.models import UserRole
from apps.fees.models import FeeStructure, Invoice, InvoiceStatus
from apps.examinations.models import Examination
from apps.results.models import Result
from apps.library.models import Book, BookLoan
from apps.students.models import Student

@pytest.mark.django_db
class TestServicesAndWorkflows:
    def get_client_for_user(self, email):
        client = APIClient()
        login_res = client.post('/api/v1/auth/login/', {
            'email': email,
            'password': 'Password123!'
        }, format='json')
        token = login_res.json()['data']['tokens']['access']
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return client

    def test_fee_financial_summary_endpoint(self):
        client = self.get_client_for_user('accountant@school.edu')
        res = client.get('/api/v1/fees/invoices/financial_summary/')
        assert res.status_code == 200
        data = res.json()
        assert 'total_billed' in data
        assert 'total_collected' in data
        assert 'collection_rate' in data

    def test_examinations_list(self):
        client = self.get_client_for_user('exam@school.edu')
        res = client.get('/api/v1/examinations/sessions/')
        assert res.status_code == 200
        assert len(res.json().get('results', [])) >= 1

    def test_library_book_catalog(self):
        client = self.get_client_for_user('librarian@school.edu')
        res = client.get('/api/v1/library/books/')
        assert res.status_code == 200
        assert len(res.json().get('results', [])) >= 1

    def test_student_profile_access(self):
        client = self.get_client_for_user('student@school.edu')
        res = client.get('/api/v1/students/records/')
        assert res.status_code == 200
        results = res.json().get('results', [])
        assert len(results) >= 1
        assert results[0]['admission_number'] == 'STU-2026-001'

    def test_teacher_can_view_classes(self):
        client = self.get_client_for_user('teacher@school.edu')
        res = client.get('/api/v1/academics/classes/')
        assert res.status_code == 200
        assert len(res.json().get('results', [])) >= 1

    # Security & Self-Service /me/ Tests (Identity derived strictly from auth user)
    def test_student_results_me_endpoint(self):
        client = self.get_client_for_user('student@school.edu')
        res = client.get('/api/v1/results/me/')
        assert res.status_code == 200
        data = res.json()
        assert data['student_admission'] == 'STU-2026-001'
        assert 'results' in data

    def test_student_attendance_me_endpoint(self):
        client = self.get_client_for_user('student@school.edu')
        res = client.get('/api/v1/attendance/me/')
        assert res.status_code == 200
        data = res.json()
        assert data['student_admission'] == 'STU-2026-001'
        assert 'summary' in data

    def test_student_fees_me_endpoint(self):
        client = self.get_client_for_user('student@school.edu')
        res = client.get('/api/v1/fees/me/')
        assert res.status_code == 200
        data = res.json()
        assert data['student_admission'] == 'STU-2026-001'
        assert 'invoices' in data

    def test_student_assignments_me_endpoint(self):
        client = self.get_client_for_user('student@school.edu')
        res = client.get('/api/v1/assignments/me/')
        assert res.status_code == 200
        data = res.json()
        assert data['student_admission'] == 'STU-2026-001'
        assert 'assignments' in data

    def test_student_timetable_me_endpoint(self):
        client = self.get_client_for_user('student@school.edu')
        res = client.get('/api/v1/timetable/me/')
        assert res.status_code == 200
        data = res.json()
        assert data['student_admission'] == 'STU-2026-001'
        assert 'slots' in data

    def test_student_cannot_access_other_student_record_by_changing_id(self):
        # Student STU-2026-001 tries to access another student's detail
        client = self.get_client_for_user('student@school.edu')
        # Querying another student's record directly
        other_students = Student.objects.exclude(user__email='student@school.edu')
        if other_students.exists():
            other_id = str(other_students.first().id)
            res = client.get(f'/api/v1/students/records/{other_id}/')
            # Must return 404 Not Found due to queryset isolation
            assert res.status_code == 404

    # === ATTENDANCE MODULE TESTS ===
    def test_attendance_daily_and_subject_bulk_mark(self):
        teacher_client = self.get_client_for_user('teacher@school.edu')
        student = Student.objects.get(admission_number='STU-2026-001')
        stream = student.current_stream

        # Teacher marks daily attendance
        res_daily = teacher_client.post('/api/v1/attendance/records/bulk_mark/', {
            'date': '2026-10-12',
            'stream_id': str(stream.id),
            'attendance_type': 'DAILY',
            'records': [
                {'student_id': str(student.id), 'status': 'PRESENT', 'notes': 'On time'}
            ]
        }, format='json')
        assert res_daily.status_code == 200
        assert res_daily.json()['success'] is True

        # Teacher marks subject attendance (if configured)
        from apps.academics.models import Subject
        cs_subj = Subject.objects.filter(code='CSC105').first()
        res_subj = teacher_client.post('/api/v1/attendance/records/bulk_mark/', {
            'date': '2026-10-12',
            'stream_id': str(stream.id),
            'attendance_type': 'SUBJECT',
            'subject_id': str(cs_subj.id),
            'records': [
                {'student_id': str(student.id), 'status': 'LATE', 'notes': 'Joined 5 mins into lab'}
            ]
        }, format='json')
        assert res_subj.status_code == 200

        # Student self-service sees their monthly summaries and attendance percentage
        student_client = self.get_client_for_user('student@school.edu')
        att_res = student_client.get('/api/v1/attendance/me/')
        assert att_res.status_code == 200
        data = att_res.json()
        assert 'summary' in data
        assert 'attendance_rate' in data['summary']
        assert 'monthly_summaries' in data
        assert len(data['monthly_summaries']) >= 1

    def test_attendance_reports_and_role_isolation(self):
        teacher_client = self.get_client_for_user('teacher@school.edu')
        res = teacher_client.get('/api/v1/attendance/records/reports/')
        assert res.status_code == 200
        data = res.json()
        assert 'overall_summary' in data
        assert 'students_breakdown' in data
        assert 'chronic_absenteeism' in data

        # Student cannot access administrative/class reports
        student_client = self.get_client_for_user('student@school.edu')
        denied = student_client.get('/api/v1/attendance/records/reports/')
        assert denied.status_code == 403

    def test_parent_sees_linked_child_attendance_and_results(self):
        parent_client = self.get_client_for_user('parent@school.edu')
        att_res = parent_client.get('/api/v1/attendance/me/')
        assert att_res.status_code == 200
        att_data = att_res.json()
        assert len(att_data['linked_children']) >= 1
        assert att_data['student_admission'] == 'STU-2026-001'

        res_res = parent_client.get('/api/v1/results/me/')
        assert res_res.status_code == 200
        res_data = res_res.json()
        assert len(res_data['linked_children']) >= 1
        assert len(res_data['results']) >= 1
        # All results visible to parent must be PUBLISHED
        for r in res_data['results']:
            assert r['status'] == 'PUBLISHED'

    # === EXAMINATION & RESULT LIFECYCLE TESTS ===
    def test_examination_candidates_roster(self):
        exam_client = self.get_client_for_user('exam@school.edu')
        from apps.examinations.models import ExaminationSubject
        es = ExaminationSubject.objects.first()
        res = exam_client.get(f'/api/v1/examinations/subjects/{es.id}/candidates/')
        assert res.status_code == 200
        data = res.json()
        assert data['total_candidates'] >= 1
        assert 'candidates' in data
        candidate = data['candidates'][0]
        assert 'admission_number' in candidate
        assert 'max_marks' in candidate

    def test_backend_is_source_of_truth_for_grading_rules(self):
        from apps.examinations.models import Grade, ExaminationSubject
        from apps.results.models import Result
        student = Student.objects.get(admission_number='STU-2026-001')
        es = ExaminationSubject.objects.first()

        # Score of 85.0 on max_marks 100 should automatically map to Grade A (80-100)
        res_a, _ = Result.objects.get_or_create(
            examination_subject=es,
            student=student,
            defaults={'marks_obtained': Decimal('85.00')}
        )
        res_a.marks_obtained = Decimal('85.00')
        res_a.save()
        assert res_a.percentage == Decimal('85.00')
        assert res_a.grade.name == 'A'

        # Score of 72.0 should map to Grade B (70-79)
        res_a.marks_obtained = Decimal('72.00')
        res_a.save()
        assert res_a.percentage == Decimal('72.00')
        assert res_a.grade.name == 'B'

        # Score of 65.0 should map to Grade C (60-69)
        res_a.marks_obtained = Decimal('65.00')
        res_a.save()
        assert res_a.grade.name == 'C'

        # Score of 54.0 should map to Grade D (50-59)
        res_a.marks_obtained = Decimal('54.00')
        res_a.save()
        assert res_a.grade.name == 'D'

        # Score of 45.0 should map to Grade E (40-49)
        res_a.marks_obtained = Decimal('45.00')
        res_a.save()
        assert res_a.grade.name == 'E'

        # Score of 25.0 should map to Grade F (0-39)
        res_a.marks_obtained = Decimal('25.00')
        res_a.save()
        assert res_a.grade.name == 'F'

    def test_results_lifecycle_approval_workflow_and_student_isolation(self):
        from apps.examinations.models import Examination, ExaminationSubject
        from apps.results.models import Result, ResultStatus
        student = Student.objects.get(admission_number='STU-2026-001')
        exam2 = Examination.objects.get(name="End-Term Final Examination 2026")
        es2 = exam2.exam_subjects.first()

        teacher_client = self.get_client_for_user('teacher@school.edu')
        exam_client = self.get_client_for_user('exam@school.edu')
        headmaster_client = self.get_client_for_user('headmaster@school.edu')
        student_client = self.get_client_for_user('student@school.edu')

        # 1. Teacher enters marks as DRAFT
        bulk_res = teacher_client.post('/api/v1/results/scores/bulk_entry/', {
            'examination_subject_id': str(es2.id),
            'target_status': 'DRAFT',
            'results': [
                {'student_id': str(student.id), 'marks_obtained': 88.0, 'remarks': 'Great effort'}
            ]
        }, format='json')
        assert bulk_res.status_code == 200

        result_obj = Result.objects.get(examination_subject=es2, student=student)
        assert result_obj.status == ResultStatus.DRAFT

        # Verify Student CANNOT see DRAFT result
        student_me = student_client.get(f'/api/v1/results/me/?examination_id={exam2.id}')
        assert student_me.status_code == 200
        # No results for exam2 should be returned because it's not PUBLISHED
        assert len(student_me.json()['results']) == 0

        # 2. Teacher SUBMITS result
        sub_res = teacher_client.post('/api/v1/results/scores/workflow_transition/', {
            'examination_subject_id': str(es2.id),
            'action': 'submit'
        }, format='json')
        assert sub_res.status_code == 200
        result_obj.refresh_from_db()
        assert result_obj.status == ResultStatus.SUBMITTED

        # Verify Student still CANNOT see SUBMITTED result
        assert len(student_client.get(f'/api/v1/results/me/?examination_id={exam2.id}').json()['results']) == 0

        # 3. Exam Officer VERIFIES result
        ver_res = exam_client.post('/api/v1/results/scores/workflow_transition/', {
            'examination_subject_id': str(es2.id),
            'action': 'verify'
        }, format='json')
        assert ver_res.status_code == 200
        result_obj.refresh_from_db()
        assert result_obj.status == ResultStatus.VERIFIED

        # Verify Student still CANNOT see VERIFIED result
        assert len(student_client.get(f'/api/v1/results/me/?examination_id={exam2.id}').json()['results']) == 0

        # 4. Headmaster APPROVES result
        appr_res = headmaster_client.post('/api/v1/results/scores/workflow_transition/', {
            'examination_subject_id': str(es2.id),
            'action': 'approve'
        }, format='json')
        assert appr_res.status_code == 200
        result_obj.refresh_from_db()
        assert result_obj.status == ResultStatus.APPROVED

        # Verify Student still CANNOT see APPROVED result
        assert len(student_client.get(f'/api/v1/results/me/?examination_id={exam2.id}').json()['results']) == 0

        # 5. Exam Officer PUBLISHES result
        pub_res = exam_client.post('/api/v1/results/scores/workflow_transition/', {
            'examination_subject_id': str(es2.id),
            'action': 'publish'
        }, format='json')
        assert pub_res.status_code == 200
        result_obj.refresh_from_db()
        assert result_obj.status == ResultStatus.PUBLISHED

        # 6. Now Student CAN see PUBLISHED result!
        student_published = student_client.get(f'/api/v1/results/me/?examination_id={exam2.id}')
        assert student_published.status_code == 200
        results_list = student_published.json()['results']
        assert len(results_list) == 1
        assert results_list[0]['marks_obtained'] == '88.00'
        assert results_list[0]['grade_name'] == 'A'
        assert results_list[0]['status'] == 'PUBLISHED'

