import pytest
from django.db import models
import uuid

# 1-5 Identity & Core Profiles
from apps.accounts.models import User
from apps.students.models import Student, Parent, StudentEnrollment
from apps.staff.models import Teacher, Staff

# 6-10 Academics
from apps.academics.models import AcademicYear, Term, Class, Stream, Subject

# 11-16 Attendance, Examinations & Grading
from apps.attendance.models import Attendance
from apps.examinations.models import Examination, ExaminationSubject, Grade
from apps.results.models import Result

# 17-21 Finance & Invoicing
from apps.fees.models import FeeStructure, FeeItem, Invoice, Payment, Receipt

# 22-24 Scheduling & Coursework
from apps.timetable.models import Timetable
from apps.assignments.models import Assignment, AssignmentSubmission

# 25-27 Library Management
from apps.library.models import Book, BookCategory, BookLoan

# 28-30 Communications & Audit Trail
from apps.notifications.models import Notification
from apps.communication.models import Announcement
from apps.audit.models import AuditLog

MODELS_REGISTRY = [
    User, Student, Teacher, Staff, Parent,
    AcademicYear, Term, Class, Stream, Subject,
    StudentEnrollment, Attendance, Examination, ExaminationSubject, Result,
    Grade, FeeStructure, FeeItem, Invoice, Payment,
    Receipt, Timetable, Assignment, AssignmentSubmission, Book,
    BookCategory, BookLoan, Notification, Announcement, AuditLog
]

def test_exactly_thirty_relational_models_exist():
    assert len(MODELS_REGISTRY) == 30
    model_names = [m.__name__ for m in MODELS_REGISTRY]
    expected_names = [
        "User", "Student", "Teacher", "Staff", "Parent",
        "AcademicYear", "Term", "Class", "Stream", "Subject",
        "StudentEnrollment", "Attendance", "Examination", "ExaminationSubject", "Result",
        "Grade", "FeeStructure", "FeeItem", "Invoice", "Payment",
        "Receipt", "Timetable", "Assignment", "AssignmentSubmission", "Book",
        "BookCategory", "BookLoan", "Notification", "Announcement", "AuditLog"
    ]
    for name in expected_names:
        assert name in model_names, f"Model {name} must exist in MODELS_REGISTRY"

def test_all_models_use_uuid_primary_keys():
    for model in MODELS_REGISTRY:
        pk_field = model._meta.pk
        assert isinstance(pk_field, models.UUIDField), (
            f"Model {model.__name__} primary key must be a UUIDField, got {type(pk_field)}"
        )

def test_all_models_have_timestamps():
    for model in MODELS_REGISTRY:
        field_names = [f.name for f in model._meta.fields]
        assert "created_at" in field_names or "timestamp" in field_names, (
            f"Model {model.__name__} must have created_at timestamp"
        )

def test_foreign_keys_have_explicit_on_delete_behavior():
    for model in MODELS_REGISTRY:
        for field in model._meta.fields:
            if isinstance(field, (models.ForeignKey, models.OneToOneField)):
                assert hasattr(field, 'remote_field') and field.remote_field.on_delete is not None, (
                    f"Foreign key {field.name} on {model.__name__} must define an explicit on_delete behavior"
                )

def test_postgresql_driver_availability():
    import psycopg
    assert psycopg.__version__ is not None
