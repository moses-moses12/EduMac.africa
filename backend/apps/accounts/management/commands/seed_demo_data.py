import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.accounts.models import UserRole
from apps.academics.models import AcademicYear, Term, Class, Stream, Subject
from apps.staff.models import Teacher, Staff
from apps.students.models import Parent, Student, StudentEnrollment, GenderChoice
from apps.attendance.models import Attendance, AttendanceStatus, AttendanceType
from apps.examinations.models import Grade, Examination, ExaminationSubject, ExamType, ExamStatus
from apps.results.models import Result, ResultStatus
from apps.fees.models import FeeStructure, FeeItem, Invoice, Payment, Receipt, InvoiceStatus, PaymentMethod
from apps.timetable.models import Timetable, DayOfWeek
from apps.assignments.models import Assignment, AssignmentSubmission, SubmissionStatus
from apps.library.models import BookCategory, Book, BookLoan, LoanStatus
from apps.communication.models import Announcement, PriorityLevel
from apps.notifications.models import Notification, NotificationType

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds comprehensive production-ready demonstration data for all 10 user roles."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Initiating database seeding..."))
        password = "Password123!"

        # 1. Create Core Users for ALL Roles + Permanent Moses Administrator
        users_data = [
            ("moses", "moses@school.edu", "Moses", "Administrator", UserRole.ADMIN, "System Administrator (Owner)", "moses"),
            ("admin", "admin@school.edu", "Sarah", "Connor", UserRole.ADMIN, "System Administrator", "Password123!"),
            ("headmaster", "headmaster@school.edu", "Dr. Arthur", "Pendelton", UserRole.HEADMASTER, "Headmaster", "Password123!"),
            ("academic", "academic@school.edu", "Prof. Marcus", "Vance", UserRole.ACADEMIC, "Academic Officer", "Password123!"),
            ("teacher", "teacher@school.edu", "Elizabeth", "Bennett", UserRole.TEACHER, "Senior Teacher", "Password123!"),
            ("student", "student@school.edu", "Alexander", "Pierce", UserRole.STUDENT, "Student", "Password123!"),
            ("parent", "parent@school.edu", "Jonathan", "Pierce", UserRole.PARENT, "Parent/Guardian", "Password123!"),
            ("accountant", "accountant@school.edu", "David", "Sterling", UserRole.ACCOUNTANT, "Bursar/Accountant", "Password123!"),
            ("librarian", "librarian@school.edu", "Clara", "Oswald", UserRole.LIBRARIAN, "Chief Librarian", "Password123!"),
            ("exam", "exam@school.edu", "Dr. Gregory", "House", UserRole.EXAM_OFFICER, "Examination Officer", "Password123!"),
            ("staff", "staff@school.edu", "Beatrice", "Montgomery", UserRole.STAFF, "School Registrar", "Password123!"),
        ]

        created_users = {}
        for uname, email, fn, ln, role, title, pwd in users_data:
            user = User.objects.filter(email=email).first()
            if not user:
                user = User.objects.filter(username=uname).first()
            if not user:
                user = User.objects.create(
                    username=uname,
                    email=email,
                    first_name=fn,
                    last_name=ln,
                    role=role,
                    phone_number="+1-555-019-2834",
                    is_active=True,
                    is_staff=(role in [UserRole.ADMIN, UserRole.HEADMASTER]),
                    is_superuser=(role == UserRole.ADMIN),
                )
            else:
                user.username = uname
                user.email = email
                user.first_name = fn
                user.last_name = ln
                user.role = role
                user.is_active = True
                user.is_staff = (role in [UserRole.ADMIN, UserRole.HEADMASTER])
                user.is_superuser = (role == UserRole.ADMIN)

            user.set_password(pwd)
            user.save()
            created_users[role] = user
            self.stdout.write(self.style.SUCCESS(f"Configured Role [{role}]: username='{uname}', email='{email}', password='{pwd}'"))

        # 2. Academic Years & Terms
        ay, _ = AcademicYear.objects.get_or_create(
            name="2026/2027",
            defaults={
                "start_date": datetime.date(2026, 9, 1),
                "end_date": datetime.date(2027, 6, 30),
                "is_current": True
            }
        )
        term1, _ = Term.objects.get_or_create(
            academic_year=ay,
            name="Term 1 (Fall)",
            defaults={
                "start_date": datetime.date(2026, 9, 1),
                "end_date": datetime.date(2026, 12, 20),
                "is_current": True
            }
        )
        term2, _ = Term.objects.get_or_create(
            academic_year=ay,
            name="Term 2 (Spring)",
            defaults={
                "start_date": datetime.date(2027, 1, 10),
                "end_date": datetime.date(2027, 4, 15),
                "is_current": False
            }
        )

        # 3. Classes and Streams
        classes_data = [
            ("Grade 9", "G09", "Junior High", 1),
            ("Grade 10", "G10", "High School", 2),
            ("Grade 11", "G11", "High School", 3),
            ("Grade 12", "G12", "Senior High", 4),
        ]
        created_classes = {}
        for c_name, c_code, stage, order in classes_data:
            c_obj, _ = Class.objects.get_or_create(
                code=c_code,
                defaults={"name": c_name, "academic_stage": stage, "order": order}
            )
            created_classes[c_code] = c_obj

        stream_10a, _ = Stream.objects.get_or_create(
            class_obj=created_classes["G10"],
            name="Section 10-A",
            defaults={"capacity": 35}
        )
        stream_10b, _ = Stream.objects.get_or_create(
            class_obj=created_classes["G10"],
            name="Section 10-B",
            defaults={"capacity": 35}
        )
        stream_11a, _ = Stream.objects.get_or_create(
            class_obj=created_classes["G11"],
            name="Section 11-A",
            defaults={"capacity": 30}
        )

        # 4. Subjects
        subjects_data = [
            ("Advanced Mathematics", "MTH201", "Mathematics", Decimal("4.0")),
            ("English Language & Literature", "ENG101", "Humanities", Decimal("3.0")),
            ("Physics Mechanics & Optics", "PHY201", "Sciences", Decimal("4.0")),
            ("Organic & Inorganic Chemistry", "CHM201", "Sciences", Decimal("4.0")),
            ("Computer Science & Python", "CSC105", "Technology", Decimal("3.5")),
            ("World History & Civics", "HIS102", "Humanities", Decimal("3.0")),
        ]
        created_subjects = {}
        for s_name, s_code, dept, units in subjects_data:
            s_obj, _ = Subject.objects.get_or_create(
                code=s_code,
                defaults={"name": s_name, "department": dept, "credit_units": units}
            )
            created_subjects[s_code] = s_obj

        # 5. Staff & Teachers Profiles
        teacher_prof, _ = Teacher.objects.get_or_create(
            user=created_users[UserRole.TEACHER],
            defaults={
                "employee_id": "TCH-2024-001",
                "qualification": "M.Sc. Pure Mathematics",
                "specialization": "Algebra & Calculus",
                "joining_date": datetime.date(2022, 8, 15)
            }
        )

        staff_prof, _ = Staff.objects.get_or_create(
            user=created_users[UserRole.STAFF],
            defaults={
                "employee_id": "STF-2023-042",
                "department": "Registrar Office",
                "designation": "Assistant Registrar",
                "joining_date": datetime.date(2023, 2, 1)
            }
        )

        # 6. Parents & Students
        parent_prof, _ = Parent.objects.get_or_create(
            user=created_users[UserRole.PARENT],
            defaults={
                "relationship_type": "FATHER",
                "occupation": "Senior Architect",
                "alternate_phone": "+1-555-099-7711"
            }
        )

        student_prof, _ = Student.objects.get_or_create(
            user=created_users[UserRole.STUDENT],
            defaults={
                "admission_number": "STU-2026-001",
                "parent": parent_prof,
                "date_of_birth": datetime.date(2010, 5, 14),
                "gender": GenderChoice.MALE,
                "blood_group": "O+",
                "emergency_contact": "+1-555-099-7711",
                "current_class": created_classes["G10"],
                "current_stream": stream_10a,
            }
        )

        # Create secondary demo student for peer comparisons
        user_stu2, _ = User.objects.get_or_create(
            email="sophia.m@school.edu",
            defaults={
                "username": "sophia.m@school.edu",
                "first_name": "Sophia",
                "last_name": "Martinez",
                "role": UserRole.STUDENT,
                "is_active": True
            }
        )
        user_stu2.set_password(password)
        user_stu2.save()

        student_prof2, _ = Student.objects.get_or_create(
            user=user_stu2,
            defaults={
                "admission_number": "STU-2026-002",
                "parent": parent_prof,
                "date_of_birth": datetime.date(2010, 8, 22),
                "gender": GenderChoice.FEMALE,
                "blood_group": "A+",
                "emergency_contact": "+1-555-099-7711",
                "current_class": created_classes["G10"],
                "current_stream": stream_10a,
            }
        )

        # Enrollments
        StudentEnrollment.objects.get_or_create(
            student=student_prof,
            academic_year=ay,
            defaults={"class_obj": created_classes["G10"], "stream": stream_10a}
        )
        StudentEnrollment.objects.get_or_create(
            student=student_prof2,
            academic_year=ay,
            defaults={"class_obj": created_classes["G10"], "stream": stream_10a}
        )

        # 7. Attendance Records (Last 10 days daily attendance + subject attendance)
        today = timezone.now().date()
        for i in range(10):
            past_date = today - datetime.timedelta(days=i)
            # Skip weekends
            if past_date.weekday() < 5:
                Attendance.objects.get_or_create(
                    student=student_prof,
                    date=past_date,
                    attendance_type=AttendanceType.DAILY,
                    subject=None,
                    defaults={
                        "stream": stream_10a,
                        "status": AttendanceStatus.PRESENT if i != 3 else AttendanceStatus.LATE,
                        "recorded_by": created_users[UserRole.TEACHER],
                        "notes": "On time" if i != 3 else "Arrived 10 mins late"
                    }
                )
                Attendance.objects.get_or_create(
                    student=student_prof2,
                    date=past_date,
                    attendance_type=AttendanceType.DAILY,
                    subject=None,
                    defaults={
                        "stream": stream_10a,
                        "status": AttendanceStatus.PRESENT,
                        "recorded_by": created_users[UserRole.TEACHER],
                    }
                )

        # Seed some Subject Attendance records (Computer Science & Mathematics)
        subj_cs = created_subjects.get("CSC105")
        subj_mth = created_subjects.get("MTH201")
        for i in range(5):
            past_date = today - datetime.timedelta(days=i)
            if past_date.weekday() < 5:
                if subj_cs:
                    Attendance.objects.get_or_create(
                        student=student_prof,
                        date=past_date,
                        attendance_type=AttendanceType.SUBJECT,
                        subject=subj_cs,
                        defaults={
                            "stream": stream_10a,
                            "status": AttendanceStatus.PRESENT,
                            "recorded_by": created_users[UserRole.TEACHER],
                            "notes": "Lab practical session attended"
                        }
                    )
                if subj_mth:
                    Attendance.objects.get_or_create(
                        student=student_prof,
                        date=past_date,
                        attendance_type=AttendanceType.SUBJECT,
                        subject=subj_mth,
                        defaults={
                            "stream": stream_10a,
                            "status": AttendanceStatus.PRESENT if i != 2 else AttendanceStatus.EXCUSED,
                            "recorded_by": created_users[UserRole.TEACHER],
                            "notes": "Excused for school debate tournament" if i == 2 else "Active class participation"
                        }
                    )

        # 8. Grading Scale (Configurable Institutional Grading Rules)
        # 80-100 = A, 70-79 = B, 60-69 = C, 50-59 = D, 40-49 = E, 0-39 = F
        grades = [
            ("A", Decimal("80.0"), Decimal("100.0"), Decimal("4.0"), "Distinction / Outstanding"),
            ("B", Decimal("70.0"), Decimal("79.99"), Decimal("3.0"), "Very Good"),
            ("C", Decimal("60.0"), Decimal("69.99"), Decimal("2.0"), "Good / Satisfactory"),
            ("D", Decimal("50.0"), Decimal("59.99"), Decimal("1.0"), "Pass"),
            ("E", Decimal("40.0"), Decimal("49.99"), Decimal("0.5"), "Marginal Pass"),
            ("F", Decimal("0.0"), Decimal("39.99"), Decimal("0.0"), "Fail / Needs Improvement"),
        ]
        created_grades = {}
        for g_name, min_s, max_s, gp, rem in grades:
            g_obj, _ = Grade.objects.get_or_create(
                name=g_name,
                defaults={"min_score": min_s, "max_score": max_s, "grade_point": gp, "remark": rem}
            )
            created_grades[g_name] = g_obj

        # 9. Examinations & Results
        # Exam 1: Published Mid-Term Examination (Accessible to Students & Parents)
        exam1, _ = Examination.objects.get_or_create(
            name="Mid-Term Assessment 2026",
            academic_year=ay,
            term=term1,
            defaults={
                "exam_type": ExamType.MID_TERM,
                "start_date": datetime.date(2026, 10, 15),
                "end_date": datetime.date(2026, 10, 25),
                "status": ExamStatus.PUBLISHED,
                "is_published": True
            }
        )

        # Exam 2: In-Progress End-Term Examination (DRAFT/SUBMITTED - NOT yet published to students)
        exam2, _ = Examination.objects.get_or_create(
            name="End-Term Final Examination 2026",
            academic_year=ay,
            term=term1,
            defaults={
                "exam_type": ExamType.FINAL,
                "start_date": datetime.date(2026, 11, 20),
                "end_date": datetime.date(2026, 11, 30),
                "status": ExamStatus.RESULTS_PENDING,
                "is_published": False
            }
        )

        for s_code, subj in created_subjects.items():
            es_obj1, _ = ExaminationSubject.objects.get_or_create(
                examination=exam1,
                subject=subj,
                class_obj=created_classes["G10"],
                defaults={
                    "max_marks": Decimal("100.00"),
                    "pass_marks": Decimal("40.00"),
                    "exam_date": datetime.date(2026, 10, 18),
                    "room": "Hall A"
                }
            )
            # Create PUBLISHED Results for Exam 1
            marks = Decimal("94.5") if s_code in ["MTH201", "CSC105"] else Decimal("85.0")
            res1, _ = Result.objects.get_or_create(
                examination_subject=es_obj1,
                student=student_prof,
                defaults={
                    "marks_obtained": marks,
                    "status": ResultStatus.PUBLISHED,
                    "remarks": "Exemplary performance",
                    "published_by": created_users[UserRole.EXAM_OFFICER],
                    "published_at": timezone.now()
                }
            )
            res2, _ = Result.objects.get_or_create(
                examination_subject=es_obj1,
                student=student_prof2,
                defaults={
                    "marks_obtained": Decimal("88.0"),
                    "status": ResultStatus.PUBLISHED,
                    "remarks": "Consistent effort",
                    "published_by": created_users[UserRole.EXAM_OFFICER],
                    "published_at": timezone.now()
                }
            )

            # Create DRAFT/SUBMITTED Results for Exam 2 to test approval/verification workflow
            es_obj2, _ = ExaminationSubject.objects.get_or_create(
                examination=exam2,
                subject=subj,
                class_obj=created_classes["G10"],
                defaults={
                    "max_marks": Decimal("100.00"),
                    "pass_marks": Decimal("40.00"),
                    "exam_date": datetime.date(2026, 11, 22),
                    "room": "Main Hall"
                }
            )
            Result.objects.get_or_create(
                examination_subject=es_obj2,
                student=student_prof,
                defaults={
                    "marks_obtained": Decimal("91.0"),
                    "status": ResultStatus.SUBMITTED,
                    "remarks": "Pending verification",
                    "submitted_by": created_users[UserRole.TEACHER],
                    "submitted_at": timezone.now()
                }
            )

        # 10. Fees, Invoices & Payments
        fee_struct, _ = FeeStructure.objects.get_or_create(
            academic_year=ay,
            term=term1,
            class_obj=created_classes["G10"],
            defaults={"due_date": datetime.date(2026, 11, 30)}
        )
        fee_items_data = [
            ("Tuition & Academic Instructional Fee", Decimal("1200.00")),
            ("Science & Computer Lab Maintenance", Decimal("250.00")),
            ("Library & Digital Resources", Decimal("100.00")),
            ("Athletics & Extracurricular Activities", Decimal("150.00")),
        ]
        for item_name, item_amt in fee_items_data:
            FeeItem.objects.get_or_create(
                fee_structure=fee_struct,
                name=item_name,
                defaults={"amount": item_amt, "is_mandatory": True}
            )
        fee_struct.update_total_from_items()

        # Invoices
        inv1, _ = Invoice.objects.get_or_create(
            student=student_prof,
            fee_structure=fee_struct,
            defaults={
                "invoice_number": "INV-2026-STU001-01",
                "total_amount": fee_struct.total_amount,
                "paid_amount": Decimal("1200.00"),
                "balance": fee_struct.total_amount - Decimal("1200.00"),
                "status": InvoiceStatus.PARTIAL,
                "due_date": fee_struct.due_date,
            }
        )

        # Payment for invoice
        if not inv1.payments.exists():
            Payment.objects.create(
                payment_number="PAY-2026-9901",
                invoice=inv1,
                amount=Decimal("1200.00"),
                payment_method=PaymentMethod.BANK_TRANSFER,
                transaction_reference="WIRE-TX-98214301",
                payment_date=today - datetime.timedelta(days=5),
                received_by=created_users[UserRole.ACCOUNTANT],
                notes="Initial term installment received via wire transfer."
            )

        # 11. Timetable Slots
        days = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY]
        schedule = [
            (created_subjects["MTH201"], datetime.time(8, 30), datetime.time(9, 30), "Room 301"),
            (created_subjects["PHY201"], datetime.time(9, 45), datetime.time(10, 45), "Science Lab B"),
            (created_subjects["ENG101"], datetime.time(11, 00), datetime.time(12, 00), "Room 204"),
            (created_subjects["CSC105"], datetime.time(13, 00), datetime.time(14, 00), "Computer Lab 1"),
        ]
        for d in days:
            for subj, st, et, rm in schedule:
                Timetable.objects.get_or_create(
                    stream=stream_10a,
                    subject=subj,
                    day_of_week=d,
                    start_time=st,
                    defaults={
                        "end_time": et,
                        "teacher": teacher_prof,
                        "room_number": rm
                    }
                )

        # 12. Assignments & Submissions
        assign1, _ = Assignment.objects.get_or_create(
            title="Calculus Optimization & Real-World Models",
            subject=created_subjects["MTH201"],
            stream=stream_10a,
            teacher=teacher_prof,
            defaults={
                "description": "Solve exercises 4.1 through 4.5. Submit complete mathematical derivations with graph illustrations.",
                "due_date": timezone.now() + datetime.timedelta(days=7),
                "max_marks": Decimal("50.00"),
            }
        )

        AssignmentSubmission.objects.get_or_create(
            assignment=assign1,
            student=student_prof,
            defaults={
                "content": "All problem sets solved with logarithmic differentiation steps.",
                "status": SubmissionStatus.SUBMITTED
            }
        )

        # 13. Library Books & Loans
        cat_sci, _ = BookCategory.objects.get_or_create(name="Sciences & Engineering", defaults={"description": "Physics, Chemistry, Engineering texts"})
        cat_lit, _ = BookCategory.objects.get_or_create(name="Literature & Fiction", defaults={"description": "Classic and modern literature"})

        book1, _ = Book.objects.get_or_create(
            isbn="978-0134093413",
            defaults={
                "title": "University Physics with Modern Physics",
                "author": "Hugh D. Young, Roger A. Freedman",
                "category": cat_sci,
                "total_copies": 15,
                "available_copies": 14,
                "shelf_location": "Aisle 3, Shelf B",
                "publication_year": 2019
            }
        )

        book2, _ = Book.objects.get_or_create(
            isbn="978-0134685991",
            defaults={
                "title": "Effective Java (3rd Edition)",
                "author": "Joshua Bloch",
                "category": cat_sci,
                "total_copies": 10,
                "available_copies": 10,
                "shelf_location": "Aisle 4, Shelf C",
                "publication_year": 2018
            }
        )

        BookLoan.objects.get_or_create(
            book=book1,
            user=created_users[UserRole.STUDENT],
            defaults={
                "due_date": today + datetime.timedelta(days=14),
                "status": LoanStatus.BORROWED
            }
        )

        # 14. Announcements & Notifications
        Announcement.objects.get_or_create(
            title="Welcome to Academic Year 2026/2027",
            defaults={
                "content": "We are thrilled to welcome all learners, faculty, and families to an exciting year of discovery and academic excellence. Mid-term review dates and parent orientation times are posted on the institutional calendar.",
                "priority": PriorityLevel.HIGH,
                "posted_by": created_users[UserRole.HEADMASTER],
                "target_roles": "ALL",
                "is_active": True
            }
        )

        Announcement.objects.get_or_create(
            title="Science Fair & Innovation Showcase 2026",
            defaults={
                "content": "Project submissions for the upcoming STEM Innovation Showcase are now open. Consult your science department advisors for safety guidelines.",
                "priority": PriorityLevel.MEDIUM,
                "posted_by": created_users[UserRole.TEACHER],
                "target_roles": "STUDENT,TEACHER,PARENT",
                "is_active": True
            }
        )

        Notification.objects.get_or_create(
            user=created_users[UserRole.STUDENT],
            title="Assignment Published: Calculus Optimization",
            defaults={
                "message": "Mrs. Bennett has assigned 'Calculus Optimization & Real-World Models', due in 7 days.",
                "notification_type": NotificationType.ACADEMIC,
                "is_read": False
            }
        )

        Notification.objects.get_or_create(
            user=created_users[UserRole.PARENT],
            title="Term 1 Fee Invoice Issued",
            defaults={
                "message": "Invoice INV-2026-STU001-01 for Term 1 has been issued. An installment of $1,200.00 has been recorded.",
                "notification_type": NotificationType.FEE,
                "is_read": False
            }
        )

        self.stdout.write(self.style.SUCCESS("Demo database successfully seeded for all 10 roles!"))
        self.stdout.write(self.style.NOTICE(f"Default login credentials for all roles: Password: {password}"))
