from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.accounts.models import UserRole
from apps.academics.models import AcademicYear, Term, Class, Subject
from apps.students.models import Student, StudentEnrollment
from apps.examinations.models import (
    Grade,
    Examination,
    ExaminationSubject,
    ExaminationType,
    ExaminationPeriod,
    ExaminationCandidate,
    ExamStatus,
    EligibilityStatus
)

User = get_user_model()

class ExaminationModuleTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='admin_exam@school.edu',
            password='testpassword123',
            role=UserRole.ADMIN,
            first_name='Admin',
            last_name='Officer'
        )
        self.student_user = User.objects.create_user(
            email='student_exam@school.edu',
            password='testpassword123',
            role=UserRole.STUDENT,
            first_name='John',
            last_name='Doe'
        )

        self.year = AcademicYear.objects.create(
            name='2026/2027',
            start_date='2026-09-01',
            end_date='2027-06-30',
            is_current=True
        )
        self.term = Term.objects.create(
            academic_year=self.year,
            name='Term 1',
            start_date='2026-09-01',
            end_date='2026-12-15'
        )
        self.class_obj = Class.objects.create(
            name='Grade 10',
            code='G10',
            order=10
        )
        self.subject = Subject.objects.create(
            name='Mathematics',
            code='MTH101'
        )
        self.student = Student.objects.create(
            user=self.student_user,
            admission_number='STU-2026-999',
            current_class=self.class_obj
        )
        StudentEnrollment.objects.create(
            student=self.student,
            class_obj=self.class_obj,
            academic_year=self.year
        )

        # Grade scale
        Grade.objects.create(name='A', min_score=Decimal('80.00'), max_score=Decimal('100.00'), grade_point=Decimal('4.00'), remark='Excellent')
        Grade.objects.create(name='B', min_score=Decimal('65.00'), max_score=Decimal('79.99'), grade_point=Decimal('3.00'), remark='Good')
        Grade.objects.create(name='C', min_score=Decimal('50.00'), max_score=Decimal('64.99'), grade_point=Decimal('2.00'), remark='Pass')
        Grade.objects.create(name='F', min_score=Decimal('0.00'), max_score=Decimal('49.99'), grade_point=Decimal('0.00'), remark='Fail')

    def test_examination_type_and_period_creation(self):
        etype = ExaminationType.objects.create(
            name='Mid-Term Examination',
            code='MID_TERM',
            default_weightage=Decimal('30.00')
        )
        self.assertEqual(etype.code, 'MID_TERM')

        period = ExaminationPeriod.objects.create(
            academic_year=self.year,
            term=self.term,
            name='Term 1 Window',
            start_date='2026-10-01',
            end_date='2026-10-31'
        )
        self.assertEqual(period.name, 'Term 1 Window')

        exam = Examination.objects.create(
            name='Mid-Term Assessment 2026',
            examination_type=etype,
            period=period,
            academic_year=self.year,
            term=self.term,
            start_date='2026-10-10',
            end_date='2026-10-20',
            weightage=Decimal('30.00')
        )
        self.assertEqual(exam.status, ExamStatus.SCHEDULED)
        self.assertFalse(exam.is_published)

    def test_examination_subject_and_candidate_sync(self):
        exam = Examination.objects.create(
            name='Mid-Term Assessment 2026',
            academic_year=self.year,
            term=self.term,
            start_date='2026-10-10',
            end_date='2026-10-20'
        )
        exam_sub = ExaminationSubject.objects.create(
            examination=exam,
            subject=self.subject,
            class_obj=self.class_obj,
            paper_code='Paper 1',
            paper_name='Core Algebra',
            max_marks=Decimal('100.00'),
            pass_marks=Decimal('50.00'),
            exam_date='2026-10-12',
            start_time='09:00:00',
            end_time='11:00:00',
            room='Hall A'
        )
        self.assertEqual(exam_sub.max_marks, Decimal('100.00'))

        # API Client: sync candidates
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/v1/examinations/sessions/{exam.id}/sync_candidates/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['total_candidates'], 1)

        candidate = ExaminationCandidate.objects.get(examination=exam, student=self.student)
        self.assertTrue(candidate.index_number.startswith('APX-2026-'))
        self.assertEqual(candidate.eligibility_status, EligibilityStatus.ELIGIBLE)
