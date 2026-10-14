import os
import django
from datetime import date, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from apps.accounts.models import User, UserRole
from apps.fees.models import FeeStructure, Invoice, Payment, Receipt, InvoiceStatus
from apps.fees.views import FeeStructureViewSet, InvoiceViewSet, PaymentViewSet
from apps.library.models import BookCategory, Book, BookLoan, LoanStatus
from apps.library.views import BookViewSet, BookLoanViewSet
from apps.examinations.models import Examination, ExaminationType, ExaminationSubject, Subject, Grade
from apps.examinations.views import ExaminationViewSet, ExaminationSubjectViewSet
from apps.results.models import Result, ResultStatus
from apps.results.views import ResultViewSet
from apps.students.models import Student
from apps.academics.models import Class, AcademicYear, Term

def verify_all_dashboards():
    print("=" * 75)
    print("VERIFYING BACKEND APIS FOR ACCOUNTANT, LIBRARIAN, AND EXAM OFFICER")
    print("=" * 75)

    factory = APIRequestFactory()

    # ─────────────────────────────────────────────────────────────
    # 1. ACCOUNTANT DASHBOARD VERIFICATION
    # ─────────────────────────────────────────────────────────────
    print("\n--- 1. Testing Accountant Role & Finance APIs ---")
    accountant_user = User.objects.filter(email="test_bursar@school.edu").first()
    if not accountant_user:
        accountant_user = User.objects.create_user(
            email="test_bursar@school.edu",
            username="test_bursar@school.edu",
            first_name="Richard",
            last_name="Sterling",
            role=UserRole.ACCOUNTANT
        )
    accountant_user.role = UserRole.ACCOUNTANT
    accountant_user.save()

    # 1a. Fee Structures List
    fs_view = FeeStructureViewSet.as_view({'get': 'list'})
    req = factory.get('/api/v1/fees/structures/')
    force_authenticate(req, user=accountant_user)
    resp = fs_view(req)
    assert resp.status_code == status.HTTP_200_OK, f"Failed FeeStructure list: {resp.status_code}"
    print(f"  ✓ Fee Structures API: 200 OK (Count: {len(resp.data.get('results', resp.data))})")

    # 1b. Invoices List
    inv_view = InvoiceViewSet.as_view({'get': 'list'})
    req = factory.get('/api/v1/fees/invoices/')
    force_authenticate(req, user=accountant_user)
    resp = inv_view(req)
    assert resp.status_code == status.HTTP_200_OK, f"Failed Invoices list: {resp.status_code}"
    print(f"  ✓ Invoices API: 200 OK (Count: {len(resp.data.get('results', resp.data))})")

    # 1c. Payments List
    pay_view = PaymentViewSet.as_view({'get': 'list'})
    req = factory.get('/api/v1/fees/payments/')
    force_authenticate(req, user=accountant_user)
    resp = pay_view(req)
    assert resp.status_code == status.HTTP_200_OK, f"Failed Payments list: {resp.status_code}"
    print(f"  ✓ Payments & Receipts API: 200 OK (Count: {len(resp.data.get('results', resp.data))})")

    # ─────────────────────────────────────────────────────────────
    # 2. LIBRARIAN DASHBOARD VERIFICATION
    # ─────────────────────────────────────────────────────────────
    print("\n--- 2. Testing Librarian Role & Catalog/Loan APIs ---")
    librarian_user = User.objects.filter(email="test_librarian@school.edu").first()
    if not librarian_user:
        librarian_user = User.objects.create_user(
            email="test_librarian@school.edu",
            username="test_librarian@school.edu",
            first_name="Beatrice",
            last_name="Vance",
            role=UserRole.LIBRARIAN
        )
    librarian_user.role = UserRole.LIBRARIAN
    librarian_user.save()

    # 2a. Books Catalog List
    book_view = BookViewSet.as_view({'get': 'list'})
    req = factory.get('/api/v1/library/books/')
    force_authenticate(req, user=librarian_user)
    resp = book_view(req)
    assert resp.status_code == status.HTTP_200_OK, f"Failed Books list: {resp.status_code}"
    print(f"  ✓ Books Catalog API: 200 OK (Count: {len(resp.data.get('results', resp.data))})")

    # 2b. Book Loans List (Borrowed, Overdue, Returned)
    loan_view = BookLoanViewSet.as_view({'get': 'list'})
    req = factory.get('/api/v1/library/loans/')
    force_authenticate(req, user=librarian_user)
    resp = loan_view(req)
    assert resp.status_code == status.HTTP_200_OK, f"Failed Loans list: {resp.status_code}"
    print(f"  ✓ Book Loans & Borrowing History API: 200 OK (Count: {len(resp.data.get('results', resp.data))})")

    # ─────────────────────────────────────────────────────────────
    # 3. EXAMINATION OFFICER DASHBOARD VERIFICATION
    # ─────────────────────────────────────────────────────────────
    print("\n--- 3. Testing Examination Officer Role & Workflow APIs ---")
    exam_user = User.objects.filter(email="test_exam_officer@school.edu").first()
    if not exam_user:
        exam_user = User.objects.create_user(
            email="test_exam_officer@school.edu",
            username="test_exam_officer@school.edu",
            first_name="Dr. Aris",
            last_name="Thorne",
            role=UserRole.EXAM_OFFICER
        )
    exam_user.role = UserRole.EXAM_OFFICER
    exam_user.save()

    # 3a. Examinations List
    exam_view = ExaminationViewSet.as_view({'get': 'list'})
    req = factory.get('/api/v1/examinations/')
    force_authenticate(req, user=exam_user)
    resp = exam_view(req)
    assert resp.status_code == status.HTTP_200_OK, f"Failed Examinations list: {resp.status_code}"
    print(f"  ✓ Examinations Sessions API: 200 OK (Count: {len(resp.data.get('results', resp.data))})")

    # 3b. Exam Schedules (ExaminationSubject) List
    sched_view = ExaminationSubjectViewSet.as_view({'get': 'list'})
    req = factory.get('/api/v1/examinations/subjects/')
    force_authenticate(req, user=exam_user)
    resp = sched_view(req)
    assert resp.status_code == status.HTTP_200_OK, f"Failed Schedules list: {resp.status_code}"
    print(f"  ✓ Schedules & Papers API: 200 OK (Count: {len(resp.data.get('results', resp.data))})")

    # 3c. Workflow Transition: Verify & Publish by Exam Officer
    transition_view = ResultViewSet.as_view({'post': 'workflow_transition'})

    # Find or create a test result to verify
    test_res = Result.objects.filter(status=ResultStatus.SUBMITTED).first()
    if not test_res:
        # Get any result and set to SUBMITTED
        test_res = Result.objects.first()
        if test_res:
            test_res.status = ResultStatus.SUBMITTED
            test_res.save()

    if test_res:
        req_ver = factory.post('/api/v1/results/workflow_transition/', {
            "action": "verify",
            "result_ids": [str(test_res.id)]
        }, format='json')
        force_authenticate(req_ver, user=exam_user)
        resp_ver = transition_view(req_ver)
        assert resp_ver.status_code == status.HTTP_200_OK, f"Failed verify transition: {resp_ver.data}"
        test_res.refresh_from_db()
        assert test_res.status == ResultStatus.VERIFIED
        print(f"  ✓ Examination Officer successfully VERIFIED result ID {test_res.id}")

        # Now test APPROVED -> PUBLISHED
        test_res.status = ResultStatus.APPROVED
        test_res.save()

        req_pub = factory.post('/api/v1/results/workflow_transition/', {
            "action": "publish",
            "result_ids": [str(test_res.id)]
        }, format='json')
        force_authenticate(req_pub, user=exam_user)
        resp_pub = transition_view(req_pub)
        assert resp_pub.status_code == status.HTTP_200_OK, f"Failed publish transition: {resp_pub.data}"
        test_res.refresh_from_db()
        assert test_res.status == ResultStatus.PUBLISHED
        print(f"  ✓ Examination Officer successfully PUBLISHED result ID {test_res.id}")

    print("\n" + "=" * 75)
    print("ALL 3 DASHBOARDS BACKEND APIS & WORKFLOWS VERIFIED SUCCESSFULLY!")
    print("=" * 75)

if __name__ == "__main__":
    verify_all_dashboards()
