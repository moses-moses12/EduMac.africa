from decimal import Decimal
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Max, Min, Count, Q, Sum
from apps.accounts.models import UserRole
from apps.students.models import Student, StudentEnrollment
from core.permissions import IsExamOfficer, IsTeacher, IsAdmin
from .models import (
    Grade,
    Examination,
    ExaminationSubject,
    ExaminationType,
    ExaminationPeriod,
    ExaminationCandidate,
    ExamStatus,
    EligibilityStatus,
    FeeClearanceStatus
)
from .serializers import (
    GradeSerializer,
    ExaminationSerializer,
    ExaminationSubjectSerializer,
    ExaminationTypeSerializer,
    ExaminationPeriodSerializer,
    ExaminationCandidateSerializer
)

class ExamBasePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in [
            UserRole.ADMIN,
            UserRole.HEADMASTER,
            UserRole.ACADEMIC,
            UserRole.EXAM_OFFICER,
            UserRole.TEACHER
        ]

class GradeViewSet(viewsets.ModelViewSet):
    """Institutional grading scale (e.g. A+: 90-100, A: 80-89, etc.)."""
    queryset = Grade.objects.all().order_by('-min_score')
    serializer_class = GradeSerializer
    permission_classes = [ExamBasePermission]

class ExaminationTypeViewSet(viewsets.ModelViewSet):
    """Institutional examination types (e.g. CAT, Mid-Term, End-Term, Mock, Quiz)."""
    queryset = ExaminationType.objects.all().order_by('name')
    serializer_class = ExaminationTypeSerializer
    permission_classes = [ExamBasePermission]
    search_fields = ['name', 'code']

class ExaminationPeriodViewSet(viewsets.ModelViewSet):
    """Academic calendar examination windows."""
    queryset = ExaminationPeriod.objects.all().select_related('academic_year', 'term').order_by('-start_date')
    serializer_class = ExaminationPeriodSerializer
    permission_classes = [ExamBasePermission]
    filterset_fields = ['academic_year', 'term', 'is_active']
    search_fields = ['name']

class ExaminationCandidateViewSet(viewsets.ModelViewSet):
    """Candidates registered for examination cycles."""
    serializer_class = ExaminationCandidateSerializer
    permission_classes = [ExamBasePermission]
    filterset_fields = ['examination', 'eligibility_status', 'fee_clearance']
    search_fields = [
        'student__admission_number',
        'student__user__first_name',
        'student__user__last_name',
        'index_number'
    ]

    def get_queryset(self):
        user = self.request.user
        qs = ExaminationCandidate.objects.all().select_related(
            'examination',
            'student__user',
            'student__current_class',
            'student__current_stream'
        )
        if user.role in [UserRole.STUDENT]:
            return qs.filter(student__user=user)
        elif user.role == UserRole.TEACHER:
            teacher = getattr(user, 'teacher_profile', None)
            if not teacher:
                return qs.none()
            assigned_classes = teacher.teaching_assignments.values_list('class_obj_id', flat=True)
            assigned_streams = teacher.teaching_assignments.filter(stream__isnull=False).values_list('stream_id', flat=True)
            return qs.filter(
                Q(student__current_class_id__in=assigned_classes) |
                Q(student__current_stream_id__in=assigned_streams)
            ).distinct()
        return qs

    @action(detail=False, methods=['post'])
    def update_status(self, request):
        """Bulk update candidate eligibility status or fee clearance."""
        if request.user.role not in [UserRole.ADMIN, UserRole.HEADMASTER, UserRole.EXAM_OFFICER]:
            return Response(
                {"error": "Only Exam Officers, Headmasters, or Admins can modify candidate clearance."},
                status=status.HTTP_403_FORBIDDEN
            )
        candidate_ids = request.data.get('candidate_ids', [])
        new_eligibility = request.data.get('eligibility_status')
        new_fee_clearance = request.data.get('fee_clearance')

        qs = ExaminationCandidate.objects.filter(id__in=candidate_ids)
        updates = {}
        if new_eligibility:
            updates['eligibility_status'] = new_eligibility
        if new_fee_clearance:
            updates['fee_clearance'] = new_fee_clearance

        if updates:
            updated_count = qs.update(**updates)
            return Response({
                "success": True,
                "updated_count": updated_count,
                "message": f"Successfully updated {updated_count} candidate records."
            })
        return Response({"error": "No updates specified."}, status=status.HTTP_400_BAD_REQUEST)

class ExaminationViewSet(viewsets.ModelViewSet):
    """Formal examination cycle and session management."""
    serializer_class = ExaminationSerializer
    permission_classes = [ExamBasePermission]
    filterset_fields = ['academic_year', 'term', 'is_published', 'status', 'exam_type']
    search_fields = ['name']

    def get_queryset(self):
        user = self.request.user
        qs = Examination.objects.all().select_related(
            'academic_year',
            'term',
            'examination_type',
            'period'
        ).prefetch_related(
            'exam_subjects__subject',
            'exam_subjects__class_obj',
            'candidates'
        )
        if user.role in [UserRole.STUDENT, UserRole.PARENT]:
            return qs.filter(is_published=True)
        return qs

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Allows Exam Officer or Admin to publish examination session and its APPROVED results."""
        if request.user.role not in [UserRole.ADMIN, UserRole.HEADMASTER, UserRole.EXAM_OFFICER]:
            return Response(
                {"error": "Only Exam Officers, Headmasters, or Admins can publish examinations."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        exam = self.get_object()
        exam.is_published = True
        exam.status = ExamStatus.PUBLISHED
        exam.save()

        # Transition all APPROVED results under this examination to PUBLISHED
        from apps.results.models import Result, ResultStatus
        updated = Result.objects.filter(
            examination_subject__examination=exam,
            status=ResultStatus.APPROVED
        ).update(
            status=ResultStatus.PUBLISHED,
            published_by=request.user
        )

        return Response({
            "success": True,
            "message": f"Examination '{exam.name}' published successfully. {updated} approved results transitioned to PUBLISHED status.",
            "is_published": True,
            "status": exam.status
        })

    @action(detail=True, methods=['post'])
    def sync_candidates(self, request, pk=None):
        """
        Auto-enrolls eligible student candidates for this examination session.
        Finds all students enrolled in the classes configured in examination subjects
        for this exam's academic year, assigns index numbers, and assesses clearance.
        """
        exam = self.get_object()
        classes = list(ExaminationSubject.objects.filter(examination=exam).values_list('class_obj_id', flat=True).distinct())

        # Check both StudentEnrollment records and current_class assignment
        enrollment_students = list(Student.objects.filter(
            enrollments__class_obj_id__in=classes,
            enrollments__academic_year=exam.academic_year
        ).distinct().select_related('user', 'current_class', 'current_stream'))

        direct_students = list(Student.objects.filter(
            current_class_id__in=classes,
            is_active=True
        ).distinct().select_related('user', 'current_class', 'current_stream'))

        students_map = {s.id: s for s in (enrollment_students + direct_students)}
        all_students = sorted(students_map.values(), key=lambda s: s.admission_number)

        year_prefix = exam.academic_year.name[:4] if exam.academic_year.name else "2026"
        created_count = 0
        existing_count = 0

        for idx, student in enumerate(all_students, start=1):
            index_num = f"APX-{year_prefix}-{idx:04d}"
            
            # Fee clearance heuristics if Fee payment exists
            fee_status = FeeClearanceStatus.CLEARED
            try:
                from apps.fees.models import FeeInvoice
                unpaid_invoices = FeeInvoice.objects.filter(
                    student=student,
                    status__in=['UNPAID', 'OVERDUE', 'PARTIAL']
                )
                if unpaid_invoices.exists():
                    total_due = sum(inv.balance_due for inv in unpaid_invoices if hasattr(inv, 'balance_due'))
                    fee_status = FeeClearanceStatus.BLOCKED if total_due > 500 else FeeClearanceStatus.CONDITIONAL
            except Exception:
                fee_status = FeeClearanceStatus.CLEARED

            obj, created = ExaminationCandidate.objects.get_or_create(
                examination=exam,
                student=student,
                defaults={
                    'index_number': index_num,
                    'eligibility_status': EligibilityStatus.ELIGIBLE if fee_status != FeeClearanceStatus.BLOCKED else EligibilityStatus.FLAGGED,
                    'fee_clearance': fee_status,
                    'attendance_rate': Decimal('95.00')
                }
            )
            if created:
                created_count += 1
            else:
                existing_count += 1

        total_candidates = ExaminationCandidate.objects.filter(examination=exam).count()
        return Response({
            "success": True,
            "message": f"Candidate roster synced: {created_count} registered, {existing_count} updated. Total candidates: {total_candidates}.",
            "total_candidates": total_candidates,
            "new_registrations": created_count
        })

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Returns comprehensive cohort performance analytics for this examination."""
        exam = self.get_object()
        from apps.results.models import Result, ResultStatus

        results_qs = Result.objects.filter(examination_subject__examination=exam)
        
        # If student or parent, only PUBLISHED results are analyzed
        if request.user.role in [UserRole.STUDENT, UserRole.PARENT]:
            results_qs = results_qs.filter(status=ResultStatus.PUBLISHED)

        total_results = results_qs.count()
        if total_results == 0:
            return Response({
                "examination_id": str(exam.id),
                "examination_name": exam.name,
                "total_candidates": exam.candidates.count(),
                "total_papers": exam.exam_subjects.count(),
                "total_results": 0,
                "cohort_mean": 0.0,
                "pass_rate": 0.0,
                "grade_distribution": {},
                "subject_performance": []
            })

        cohort_mean = results_qs.aggregate(Avg('percentage'))['percentage__avg'] or Decimal('0.00')
        passed_count = results_qs.filter(is_passed=True).count()
        pass_rate = round((passed_count / total_results) * 100, 2) if total_results > 0 else 0.0

        # Grade distribution
        grades = Grade.objects.all().order_by('-min_score')
        grade_dist = {}
        for g in grades:
            cnt = results_qs.filter(grade=g).count()
            grade_dist[g.name] = {
                "count": cnt,
                "percentage": round((cnt / total_results) * 100, 1) if total_results > 0 else 0.0
            }

        # Subject breakdown
        subjects_data = []
        for es in exam.exam_subjects.select_related('subject', 'class_obj'):
            s_results = results_qs.filter(examination_subject=es)
            s_cnt = s_results.count()
            s_mean = s_results.aggregate(Avg('percentage'))['percentage__avg'] or Decimal('0.00')
            s_pass = s_results.filter(is_passed=True).count()
            s_pass_rate = round((s_pass / s_cnt) * 100, 1) if s_cnt > 0 else 0.0

            subjects_data.append({
                "subject_id": str(es.subject.id),
                "subject_code": es.subject.code,
                "subject_name": es.subject.name,
                "class_name": es.class_obj.name,
                "max_marks": float(es.max_marks),
                "pass_marks": float(es.pass_marks),
                "candidates_assessed": s_cnt,
                "mean_percentage": round(float(s_mean), 2),
                "pass_rate": s_pass_rate
            })

        return Response({
            "examination_id": str(exam.id),
            "examination_name": exam.name,
            "status": exam.status,
            "is_published": exam.is_published,
            "total_candidates": exam.candidates.count(),
            "total_papers": exam.exam_subjects.count(),
            "total_results": total_results,
            "cohort_mean": round(float(cohort_mean), 2),
            "pass_rate": pass_rate,
            "grade_distribution": grade_dist,
            "subject_performance": subjects_data
        })

class ExaminationSubjectViewSet(viewsets.ModelViewSet):
    """Subject assessment configuration and timetabled schedule."""
    serializer_class = ExaminationSubjectSerializer
    permission_classes = [ExamBasePermission]
    filterset_fields = ['examination', 'subject', 'class_obj', 'exam_date']

    def get_queryset(self):
        qs = ExaminationSubject.objects.all().select_related(
            'examination',
            'subject',
            'class_obj',
            'invigilator__user'
        )
        user = self.request.user
        if user.role == UserRole.TEACHER:
            teacher = getattr(user, 'teacher_profile', None)
            if not teacher:
                return qs.none()
            assigned_classes = teacher.teaching_assignments.values_list('class_obj_id', flat=True)
            assigned_subjects = teacher.teaching_assignments.values_list('subject_id', flat=True)
            return qs.filter(
                class_obj_id__in=assigned_classes,
                subject_id__in=assigned_subjects
            ).distinct()
        return qs

    @action(detail=True, methods=['get'])
    def candidates(self, request, pk=None):
        """Returns registered student candidates and their marks for this examination subject."""
        exam_subject = self.get_object()
        class_obj = exam_subject.class_obj
        examination = exam_subject.examination
        academic_year = examination.academic_year

        # Students enrolled in this class for the exam's academic year
        enrollments = StudentEnrollment.objects.filter(
            class_obj=class_obj,
            academic_year=academic_year
        ).select_related('student__user', 'stream').order_by('student__admission_number')

        # Existing candidate profiles
        candidate_profiles = {
            c.student_id: c
            for c in ExaminationCandidate.objects.filter(examination=examination)
        }

        # Existing results map
        from apps.results.models import Result
        results_map = {
            r.student_id: r
            for r in Result.objects.filter(examination_subject=exam_subject).select_related('grade')
        }

        candidates_data = []
        for enr in enrollments:
            stu = enr.student
            res = results_map.get(stu.id)
            c_prof = candidate_profiles.get(stu.id)

            candidates_data.append({
                "student_id": str(stu.id),
                "admission_number": stu.admission_number,
                "name": stu.user.get_full_name() if stu.user else stu.admission_number,
                "index_number": c_prof.index_number if c_prof else f"IND-{stu.admission_number[-4:]}",
                "stream_name": enr.stream.name if enr.stream else (stu.current_stream.name if stu.current_stream else "N/A"),
                "eligibility_status": c_prof.eligibility_status if c_prof else "ELIGIBLE",
                "fee_clearance": c_prof.fee_clearance if c_prof else "CLEARED",
                "attendance_rate": float(c_prof.attendance_rate) if c_prof else 95.0,
                "has_result": res is not None,
                "result_id": str(res.id) if res else None,
                "marks_obtained": float(res.marks_obtained) if res else None,
                "theory_marks": float(res.theory_marks) if (res and res.theory_marks is not None) else None,
                "practical_marks": float(res.practical_marks) if (res and res.practical_marks is not None) else None,
                "percentage": float(res.percentage) if res else None,
                "max_marks": float(exam_subject.max_marks),
                "pass_marks": float(exam_subject.pass_marks),
                "is_passed": res.is_passed if res else None,
                "grade": res.grade.name if (res and res.grade) else None,
                "status": res.status if res else "NOT_ENTERED",
                "remarks": res.remarks if res else ""
            })

        return Response({
            "examination_subject_id": str(exam_subject.id),
            "examination_name": exam_subject.examination.name,
            "subject_name": exam_subject.subject.name,
            "subject_code": exam_subject.subject.code,
            "paper_code": exam_subject.paper_code,
            "paper_name": exam_subject.paper_name,
            "class_name": exam_subject.class_obj.name,
            "max_marks": float(exam_subject.max_marks),
            "pass_marks": float(exam_subject.pass_marks),
            "exam_date": exam_subject.exam_date,
            "start_time": str(exam_subject.start_time) if exam_subject.start_time else None,
            "end_time": str(exam_subject.end_time) if exam_subject.end_time else None,
            "room": exam_subject.room,
            "total_candidates": len(candidates_data),
            "candidates": candidates_data
        })

    @action(detail=False, methods=['get'])
    def clashes(self, request):
        """
        Timetable clash detection algorithm:
        Checks for room double-booking, class overlapping exams, or invigilator conflicts.
        """
        exam_id = request.query_params.get('examination_id')
        qs = ExaminationSubject.objects.filter(exam_date__isnull=False, start_time__isnull=False, end_time__isnull=False)
        if exam_id:
            qs = qs.filter(examination_id=exam_id)

        all_slots = list(qs.select_related('subject', 'class_obj', 'invigilator__user'))
        clashes = []

        for i in range(len(all_slots)):
            for j in range(i + 1, len(all_slots)):
                slot_a = all_slots[i]
                slot_b = all_slots[j]

                # Same date check
                if slot_a.exam_date == slot_b.exam_date:
                    # Time overlap check: start_a < end_b and end_a > start_b
                    if slot_a.start_time < slot_b.end_time and slot_a.end_time > slot_b.start_time:
                        # 1. Venue Room Clash
                        if slot_a.room and slot_b.room and slot_a.room.strip().lower() == slot_b.room.strip().lower():
                            clashes.append({
                                "type": "ROOM_DOUBLE_BOOKED",
                                "severity": "HIGH",
                                "date": str(slot_a.exam_date),
                                "room": slot_a.room,
                                "message": f"Room '{slot_a.room}' is double-booked on {slot_a.exam_date} between {slot_a.subject.name} and {slot_b.subject.name}.",
                                "slot_1": str(slot_a.id),
                                "slot_2": str(slot_b.id)
                            })
                        # 2. Class Clash
                        if slot_a.class_obj_id == slot_b.class_obj_id:
                            clashes.append({
                                "type": "CLASS_SCHEDULE_OVERLAP",
                                "severity": "CRITICAL",
                                "date": str(slot_a.exam_date),
                                "class_name": slot_a.class_obj.name,
                                "message": f"Class '{slot_a.class_obj.name}' has simultaneous exams on {slot_a.exam_date}: {slot_a.subject.name} and {slot_b.subject.name}.",
                                "slot_1": str(slot_a.id),
                                "slot_2": str(slot_b.id)
                            })
                        # 3. Invigilator Clash
                        if slot_a.invigilator_id and slot_b.invigilator_id and slot_a.invigilator_id == slot_b.invigilator_id:
                            inv_name = slot_a.invigilator.user.get_full_name() if slot_a.invigilator.user else "Invigilator"
                            clashes.append({
                                "type": "INVIGILATOR_OVERBOOKED",
                                "severity": "HIGH",
                                "date": str(slot_a.exam_date),
                                "invigilator": inv_name,
                                "message": f"Invigilator '{inv_name}' is scheduled to invigilate two exams simultaneously on {slot_a.exam_date}.",
                                "slot_1": str(slot_a.id),
                                "slot_2": str(slot_b.id)
                            })

        return Response({
            "has_clashes": len(clashes) > 0,
            "total_clashes": len(clashes),
            "clashes": clashes
        })
