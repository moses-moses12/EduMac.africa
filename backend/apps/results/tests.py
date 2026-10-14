from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.accounts.models import UserRole
from apps.academics.models import AcademicYear, Term, Class, Subject
from apps.students.models import Student, StudentEnrollment
from apps.examinations.models import Grade, Examination, ExaminationSubject, ExamStatus
from apps.results.models import Result, ResultStatus, AttendanceStatus

User = get_user_model()

class ResultLifecycleAndVisibilityTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin = User.objects.create_user(
            email='admin@school.edu',
            password='password123',
            role=UserRole.ADMIN,
            first_name='Admin',
            last_name='User'
        )
        self.teacher = User.objects.create_user(
            email='teacher@school.edu',
            password='password123',
            role=UserRole.TEACHER,
            first_name='Marcus',
            last_name='Vance'
        )
        self.exam_officer = User.objects.create_user(
            email='exam_officer@school.edu',
            password='password123',
            role=UserRole.EXAM_OFFICER,
            first_name='Aris',
            last_name='Thorne'
        )
        self.headmaster = User.objects.create_user(
            email='headmaster@school.edu',
            password='password123',
            role=UserRole.HEADMASTER,
            first_name='Principal',
            last_name='Harrison'
        )
        self.student_user = User.objects.create_user(
            email='pupil@school.edu',
            password='password123',
            role=UserRole.STUDENT,
            first_name='Alexander',
            last_name='Pierce'
        )

        # Academics
        self.year = AcademicYear.objects.create(name='2026/2027', start_date='2026-09-01', end_date='2027-06-30', is_current=True)
        self.term = Term.objects.create(academic_year=self.year, name='Term 1', start_date='2026-09-01', end_date='2026-12-15')
        self.class_obj = Class.objects.create(name='Form 4 Science', code='F4SCI', order=4)
        self.subject = Subject.objects.create(name='Pure Mathematics', code='MTH201')

        self.student = Student.objects.create(
            user=self.student_user,
            admission_number='STU-2026-001',
            current_class=self.class_obj
        )
        StudentEnrollment.objects.create(
            student=self.student,
            class_obj=self.class_obj,
            academic_year=self.year
        )

        # Institutional Grade Scale
        self.grade_a = Grade.objects.create(name='A', min_score=Decimal('80.00'), max_score=Decimal('100.00'), grade_point=Decimal('12.00'), remark='Excellent')
        self.grade_b = Grade.objects.create(name='B', min_score=Decimal('65.00'), max_score=Decimal('79.99'), grade_point=Decimal('9.00'), remark='Good')
        self.grade_c = Grade.objects.create(name='C', min_score=Decimal('50.00'), max_score=Decimal('64.99'), grade_point=Decimal('6.00'), remark='Pass')
        self.grade_e = Grade.objects.create(name='E', min_score=Decimal('0.00'), max_score=Decimal('49.99'), grade_point=Decimal('1.00'), remark='Fail')

        # Examination & Subject
        self.exam = Examination.objects.create(
            name='Mid-Term Assessment 2026',
            academic_year=self.year,
            term=self.term,
            start_date='2026-10-10',
            end_date='2026-10-20'
        )
        self.exam_subject = ExaminationSubject.objects.create(
            examination=self.exam,
            subject=self.subject,
            class_obj=self.class_obj,
            max_marks=Decimal('100.00'),
            pass_marks=Decimal('50.00')
        )

    def test_marks_validation_and_result_calculation(self):
        # 1. Invalid negative marks
        with self.assertRaises(ValidationError):
            res_bad = Result(
                examination_subject=self.exam_subject,
                student=self.student,
                marks_obtained=Decimal('-5.00')
            )
            res_bad.full_clean()

        # 2. Invalid marks > max_marks
        with self.assertRaises(ValidationError):
            res_over = Result(
                examination_subject=self.exam_subject,
                student=self.student,
                marks_obtained=Decimal('105.00')
            )
            res_over.full_clean()

        # 3. Valid marks auto-calculation
        res = Result.objects.create(
            examination_subject=self.exam_subject,
            student=self.student,
            marks_obtained=Decimal('88.00')
        )
        self.assertEqual(res.percentage, Decimal('88.00'))
        self.assertTrue(res.is_passed)
        self.assertEqual(res.grade, self.grade_a)
        self.assertEqual(res.status, ResultStatus.DRAFT)

    def test_lifecycle_workflow_progression_and_revert(self):
        res = Result.objects.create(
            examination_subject=self.exam_subject,
            student=self.student,
            marks_obtained=Decimal('85.00')
        )
        self.assertEqual(res.status, ResultStatus.DRAFT)

        # 1. Submit (DRAFT -> SUBMITTED)
        res.transition_to(ResultStatus.SUBMITTED, self.teacher)
        self.assertEqual(res.status, ResultStatus.SUBMITTED)
        self.assertEqual(res.submitted_by, self.teacher)

        # 2. Verify (SUBMITTED -> VERIFIED)
        res.transition_to(ResultStatus.VERIFIED, self.exam_officer)
        self.assertEqual(res.status, ResultStatus.VERIFIED)
        self.assertEqual(res.verified_by, self.exam_officer)

        # 3. Approve (VERIFIED -> APPROVED)
        res.transition_to(ResultStatus.APPROVED, self.headmaster)
        self.assertEqual(res.status, ResultStatus.APPROVED)
        self.assertEqual(res.approved_by, self.headmaster)

        # 4. Revert test: Executive reverts approved result with reason
        res.transition_to(ResultStatus.DRAFT, self.admin, reason='Recount requested by candidate')
        self.assertEqual(res.status, ResultStatus.DRAFT)
        self.assertEqual(res.reverted_by, self.admin)
        self.assertEqual(res.revert_reason, 'Recount requested by candidate')

    def test_strict_student_visibility_only_published(self):
        """
        CRITICAL TEST:
        Students must NEVER see DRAFT, SUBMITTED, VERIFIED, or APPROVED results.
        They can ONLY see results in PUBLISHED status.
        """
        res = Result.objects.create(
            examination_subject=self.exam_subject,
            student=self.student,
            marks_obtained=Decimal('92.00')
        )

        # Authenticate as student
        self.client.force_authenticate(user=self.student_user)

        # A) Status: DRAFT -> Student should see NOTHING
        r_me = self.client.get('/api/v1/results/me/')
        self.assertEqual(r_me.status_code, 200)
        self.assertEqual(len(r_me.data['results']), 0)
        self.assertEqual(r_me.data['summary']['total_subjects'], 0)

        r_scores = self.client.get('/api/v1/results/scores/')
        self.assertEqual(len(r_scores.data.get('results', r_scores.data)), 0)

        # B) Status: SUBMITTED -> Student should see NOTHING
        res.transition_to(ResultStatus.SUBMITTED, self.teacher)
        r_me = self.client.get('/api/v1/results/me/')
        self.assertEqual(len(r_me.data['results']), 0)

        # C) Status: VERIFIED -> Student should see NOTHING
        res.transition_to(ResultStatus.VERIFIED, self.exam_officer)
        r_me = self.client.get('/api/v1/results/me/')
        self.assertEqual(len(r_me.data['results']), 0)

        # D) Status: APPROVED -> Student should see NOTHING
        res.transition_to(ResultStatus.APPROVED, self.headmaster)
        r_me = self.client.get('/api/v1/results/me/')
        self.assertEqual(len(r_me.data['results']), 0)

        # E) Status: PUBLISHED -> Student CAN NOW see the result!
        res.transition_to(ResultStatus.PUBLISHED, self.exam_officer)
        r_me = self.client.get('/api/v1/results/me/')
        self.assertEqual(r_me.status_code, 200)
        self.assertEqual(len(r_me.data['results']), 1)
        self.assertEqual(r_me.data['results'][0]['marks_obtained'], '92.00')
        self.assertEqual(r_me.data['summary']['total_subjects'], 1)
        self.assertEqual(r_me.data['summary']['overall_grade'], 'A')

        # List endpoint also returns 1 result now
        r_scores = self.client.get('/api/v1/results/scores/')
        results_list = r_scores.data.get('results', r_scores.data)
        self.assertEqual(len(results_list), 1)
        self.assertEqual(results_list[0]['status'], 'PUBLISHED')
