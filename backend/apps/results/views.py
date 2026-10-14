from decimal import Decimal
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Sum, Count, Max, Min
from django.utils import timezone
from apps.accounts.models import UserRole
from apps.students.models import Student
from apps.examinations.models import Examination, ExaminationSubject, Grade
from .models import Result, ResultStatus, AttendanceStatus
from .serializers import ResultSerializer, BulkResultEntrySerializer, WorkflowTransitionSerializer

class StudentMyResultsView(APIView):
    """
    Self-service endpoint deriving identity strictly from the authenticated session.
    CRITICAL SECURITY SPECIFICATION:
    Students and parents can ONLY see PUBLISHED results. Under no circumstances
    can draft, submitted, verified, or pending approval marks be exposed.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        student = None
        linked_children = []

        if user.role == UserRole.STUDENT:
            student = Student.objects.filter(user=user).select_related('user', 'current_class').first()
        elif user.role == UserRole.PARENT:
            parent_profile = getattr(user, 'parent_profile', None)
            if parent_profile:
                children = parent_profile.children.all().select_related('user', 'current_class')
                linked_children = [
                    {
                        "id": str(c.id),
                        "admission_number": c.admission_number,
                        "name": c.user.get_full_name(),
                        "class_name": c.current_class.name if c.current_class else "N/A"
                    } for c in children
                ]
                requested_student_id = request.query_params.get('student_id')
                if requested_student_id:
                    student = children.filter(id=requested_student_id).first()
                else:
                    student = children.first()
        else:
            return Response(
                {"error": "This endpoint is restricted to authenticated students and guardians."},
                status=status.HTTP_403_FORBIDDEN
            )

        if not student:
            return Response(
                {"error": "No student profile associated with this account."},
                status=status.HTTP_404_NOT_FOUND
            )

        # STRICT ENFORCEMENT: ONLY PUBLISHED results are visible to students and parents
        results = Result.objects.filter(
            student=student,
            status=ResultStatus.PUBLISHED
        ).select_related(
            'examination_subject__examination__academic_year',
            'examination_subject__examination__term',
            'examination_subject__subject',
            'examination_subject__class_obj',
            'grade'
        ).order_by('-created_at')

        exam_filter = request.query_params.get('examination_id')
        if exam_filter:
            results = results.filter(examination_subject__examination_id=exam_filter)

        total_marks = results.aggregate(Sum('marks_obtained'))['marks_obtained__sum'] or Decimal('0.00')
        total_max = results.aggregate(Sum('examination_subject__max_marks'))['examination_subject__max_marks__sum'] or Decimal('0.00')
        avg_pct = results.aggregate(Avg('percentage'))['percentage__avg'] or Decimal('0.00')
        avg_pct = round(avg_pct, 2)

        # Lookup overall grade from Grade scale
        overall_grade = Grade.objects.filter(min_score__lte=avg_pct, max_score__gte=avg_pct).order_by('-min_score').first()

        serialized_results = ResultSerializer(results, many=True).data

        # Available examinations that have published results for this student
        available_exams = (
            Examination.objects.filter(
                exam_subjects__results__student=student,
                exam_subjects__results__status=ResultStatus.PUBLISHED
            )
            .distinct()
            .values('id', 'name', 'academic_year__name', 'term__name')
        )

        return Response({
            "student_id": str(student.id),
            "student_admission": student.admission_number,
            "student_name": student.user.get_full_name(),
            "class_name": student.current_class.name if student.current_class else "N/A",
            "linked_children": linked_children,
            "summary": {
                "total_subjects": results.count(),
                "total_marks": float(total_marks),
                "total_max_marks": float(total_max),
                "average_percentage": float(avg_pct),
                "overall_grade": overall_grade.name if overall_grade else "N/A",
                "grade_point": float(overall_grade.grade_point) if overall_grade else 0.0,
                "performance_summary": overall_grade.remark if overall_grade else "No assessment record",
                "has_published_results": results.exists()
            },
            "available_examinations": list(available_exams),
            "results": serialized_results
        })

class ResultViewSet(viewsets.ModelViewSet):
    """Core marks and score sheet management with lifecycle workflow."""
    serializer_class = ResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = [
        'examination_subject__examination',
        'examination_subject',
        'student',
        'grade',
        'status',
        'is_passed',
        'attendance_status'
    ]
    search_fields = [
        'student__admission_number',
        'student__user__first_name',
        'student__user__last_name',
        'examination_subject__subject__name',
        'examination_subject__subject__code'
    ]

    def get_queryset(self):
        user = self.request.user
        qs = Result.objects.all().select_related(
            'examination_subject__examination__academic_year',
            'examination_subject__examination__term',
            'examination_subject__subject',
            'examination_subject__class_obj',
            'student__user',
            'grade',
            'submitted_by',
            'verified_by',
            'approved_by',
            'published_by',
            'reverted_by'
        )
        # CRITICAL SECURITY RULE: Students and parents can ONLY see PUBLISHED results
        if user.role == UserRole.STUDENT:
            return qs.filter(student__user=user, status=ResultStatus.PUBLISHED)
        elif user.role == UserRole.PARENT:
            return qs.filter(student__parent__user=user, status=ResultStatus.PUBLISHED)
        elif user.role == UserRole.TEACHER:
            teacher = getattr(user, 'teacher_profile', None)
            if not teacher:
                return qs.none()
            assigned_classes = teacher.teaching_assignments.values_list('class_obj_id', flat=True)
            assigned_subjects = teacher.teaching_assignments.values_list('subject_id', flat=True)
            return qs.filter(
                examination_subject__class_obj_id__in=assigned_classes,
                examination_subject__subject_id__in=assigned_subjects
            )
        elif user.role == UserRole.STAFF:
            # Reception staff do NOT have unrestricted access to preliminary / unmoderated results
            return qs.filter(status=ResultStatus.PUBLISHED)
        return qs

    def create(self, request, *args, **kwargs):
        if request.user.role == UserRole.STAFF:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Reception staff cannot create examination results.")
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role == UserRole.STAFF:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Reception staff cannot modify examination results.")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role == UserRole.STAFF:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Reception staff cannot delete examination results.")
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        if self.request.user.role == UserRole.STAFF:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Reception staff cannot create examination results.")
        serializer.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        if self.request.user.role == UserRole.STAFF:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Reception staff cannot modify examination results.")
        if self.request.user.role == UserRole.TEACHER and instance.status != ResultStatus.DRAFT:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(f"Cannot directly modify result in status '{instance.status}'. Only DRAFT results can be modified.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role == UserRole.STAFF:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Reception staff cannot delete examination results.")
        if self.request.user.role == UserRole.TEACHER and instance.status != ResultStatus.DRAFT:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(f"Cannot delete result in status '{instance.status}'. Only DRAFT results can be deleted.")
        instance.delete()

    @action(detail=False, methods=['post'])
    def bulk_entry(self, request):
        """
        Allows teachers or exam officers to enter/save score sheets in batch with validation.
        Enforces:
        - 0 <= marks <= max_marks
        - Status locking: Teachers cannot modify SUBMITTED/VERIFIED/APPROVED/PUBLISHED records
        - Automatic percentage, pass status, and grade calculation
        """
        user = request.user
        if user.role not in [UserRole.TEACHER, UserRole.EXAM_OFFICER, UserRole.ACADEMIC, UserRole.HEADMASTER, UserRole.ADMIN]:
            return Response(
                {"error": "Reception staff and unauthorized roles cannot enter or modify examination marks."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = BulkResultEntrySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        exam_subject_id = serializer.validated_data['examination_subject_id']
        target_status = serializer.validated_data.get('target_status', ResultStatus.DRAFT)
        results_data = serializer.validated_data['results']

        try:
            exam_subject = ExaminationSubject.objects.select_related('examination').get(id=exam_subject_id)
        except ExaminationSubject.DoesNotExist:
            return Response({"error": "Examination subject not found."}, status=status.HTTP_404_NOT_FOUND)

        max_marks = exam_subject.max_marks
        pass_marks = exam_subject.pass_marks
        errors = []
        saved_count = 0
        now = timezone.now()
        is_teacher_only = (user.role == UserRole.TEACHER)

        if is_teacher_only:
            teacher = getattr(user, 'teacher_profile', None)
            if not teacher or not teacher.teaching_assignments.filter(
                class_obj=exam_subject.class_obj,
                subject=exam_subject.subject
            ).exists():
                return Response(
                    {"error": "Access Denied: You are not assigned to teach this class and subject."},
                    status=status.HTTP_403_FORBIDDEN
                )

        for item in results_data:
            student_id = item['student_id']
            marks = item['marks_obtained']
            theory = item.get('theory_marks')
            practical = item.get('practical_marks')
            att_status = item.get('attendance_status', AttendanceStatus.PRESENT)

            # Validation: absent students
            if att_status == AttendanceStatus.ABSENT:
                marks = Decimal('0.00')

            # Validation: bounds check
            if marks < Decimal('0.00') or marks > max_marks:
                errors.append(f"Student {student_id}: marks ({marks}) must be between 0 and maximum marks ({max_marks}).")
                continue

            # Check existing status locking
            existing_res = Result.objects.filter(examination_subject=exam_subject, student_id=student_id).first()
            if existing_res and is_teacher_only and existing_res.status in [ResultStatus.SUBMITTED, ResultStatus.VERIFIED, ResultStatus.APPROVED, ResultStatus.PUBLISHED]:
                errors.append(f"Student {student_id}: cannot modify record in locked status '{existing_res.status}'. Request Exam Officer to revert.")
                continue

            obj, created = Result.objects.get_or_create(
                examination_subject=exam_subject,
                student_id=student_id,
                defaults={
                    'marks_obtained': marks,
                    'theory_marks': theory,
                    'practical_marks': practical,
                    'attendance_status': att_status,
                    'remarks': item.get('remarks', ''),
                    'status': target_status,
                    'submitted_by': user if target_status == ResultStatus.SUBMITTED else None,
                    'submitted_at': now if target_status == ResultStatus.SUBMITTED else None,
                }
            )
            if not created:
                obj.marks_obtained = marks
                obj.theory_marks = theory
                obj.practical_marks = practical
                obj.attendance_status = att_status
                if item.get('remarks'):
                    obj.remarks = item['remarks']
                obj.status = target_status
                if target_status == ResultStatus.SUBMITTED:
                    obj.submitted_by = user
                    obj.submitted_at = now
                obj.save()

            saved_count += 1

        if errors:
            return Response({
                "partial_success": True if saved_count > 0 else False,
                "saved_count": saved_count,
                "errors": errors
            }, status=status.HTTP_207_MULTI_STATUS if saved_count > 0 else status.HTTP_400_BAD_REQUEST)

        return Response({
            "success": True,
            "message": f"Successfully processed {saved_count} candidate results as '{target_status}'.",
            "examination_subject_id": str(exam_subject_id),
            "status": target_status,
            "saved_count": saved_count
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def workflow_transition(self, request):
        """
        Strict 4-Tier Lifecycle Transitions:
        DRAFT -> SUBMITTED -> VERIFIED -> APPROVED -> PUBLISHED
        with role authorization and audit tracking.
        """
        serializer = WorkflowTransitionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        action_name = serializer.validated_data['action']
        exam_subject_id = serializer.validated_data.get('examination_subject_id')
        exam_id = serializer.validated_data.get('examination_id')
        result_ids = serializer.validated_data.get('result_ids')
        reason = serializer.validated_data.get('reason', '')

        user = request.user
        role = user.role

        qs = Result.objects.all()
        if exam_subject_id:
            qs = qs.filter(examination_subject_id=exam_subject_id)
        elif exam_id:
            qs = qs.filter(examination_subject__examination_id=exam_id)
        elif result_ids:
            qs = qs.filter(id__in=result_ids)
        else:
            return Response(
                {"error": "Either examination_subject_id, examination_id, or result_ids is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        now = timezone.now()

        # Tier 1: SUBMIT (DRAFT -> SUBMITTED)
        if action_name == 'submit':
            # Teachers or exam officers submit draft results
            if role not in [UserRole.TEACHER, UserRole.EXAM_OFFICER, UserRole.ACADEMIC, UserRole.HEADMASTER, UserRole.ADMIN]:
                return Response({"error": "Unauthorized to submit results."}, status=status.HTTP_403_FORBIDDEN)
            updated = qs.filter(status=ResultStatus.DRAFT).update(
                status=ResultStatus.SUBMITTED,
                submitted_by=user,
                submitted_at=now
            )

        # Tier 2: VERIFY (SUBMITTED -> VERIFIED)
        elif action_name == 'verify':
            if role not in [UserRole.EXAM_OFFICER, UserRole.ACADEMIC, UserRole.HEADMASTER, UserRole.ADMIN]:
                return Response(
                    {"error": "Only Examination Officers, Academic coordinators, or Admins can verify results."},
                    status=status.HTTP_403_FORBIDDEN
                )
            updated = qs.filter(status=ResultStatus.SUBMITTED).update(
                status=ResultStatus.VERIFIED,
                verified_by=user,
                verified_at=now
            )

        # Tier 3: APPROVE (VERIFIED -> APPROVED)
        elif action_name == 'approve':
            if role not in [UserRole.HEADMASTER, UserRole.ADMIN]:
                return Response(
                    {"error": "Only Headmaster or System Admin can approve examination results."},
                    status=status.HTTP_403_FORBIDDEN
                )
            updated = qs.filter(status=ResultStatus.VERIFIED).update(
                status=ResultStatus.APPROVED,
                approved_by=user,
                approved_at=now
            )

        # Tier 4: PUBLISH (APPROVED -> PUBLISHED)
        elif action_name == 'publish':
            if role not in [UserRole.EXAM_OFFICER, UserRole.HEADMASTER, UserRole.ADMIN]:
                return Response(
                    {"error": "Only Exam Officers, Headmaster, or Admin can publish results."},
                    status=status.HTTP_403_FORBIDDEN
                )
            updated = qs.filter(status=ResultStatus.APPROVED).update(
                status=ResultStatus.PUBLISHED,
                published_by=user,
                published_at=now
            )

        # REVERT back to DRAFT
        elif action_name == 'revert':
            if role not in [UserRole.EXAM_OFFICER, UserRole.HEADMASTER, UserRole.ADMIN]:
                return Response(
                    {"error": "Only Exam Officers, Headmaster, or Admin can revert result lifecycle states."},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Revert non-published results (or published if Headmaster/Admin)
            revert_qs = qs.exclude(status=ResultStatus.PUBLISHED) if role not in [UserRole.HEADMASTER, UserRole.ADMIN] else qs
            updated = revert_qs.update(
                status=ResultStatus.DRAFT,
                reverted_by=user,
                reverted_at=now,
                revert_reason=reason
            )
        else:
            return Response({"error": "Invalid action specified."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "success": True,
            "action": action_name,
            "transitioned_count": updated,
            "message": f"Successfully performed '{action_name}' on {updated} result records."
        })

    @action(detail=False, methods=['get'])
    def report_card(self, request):
        """Generates official academic report card for a student & examination."""
        student_id = request.query_params.get('student_id')
        exam_id = request.query_params.get('examination_id')

        if not student_id or not exam_id:
            return Response({"error": "student_id and examination_id query parameters are required."}, status=400)

        user = request.user
        student = Student.objects.select_related('user', 'current_class', 'current_stream').filter(id=student_id).first()
        if not student:
            return Response({"error": "Student not found."}, status=404)

        # Verification of student or parent accessing own child
        if user.role == UserRole.STUDENT and student.user != user:
            return Response({"error": "Access denied to other student report cards."}, status=403)
        if user.role == UserRole.PARENT and student.parent and student.parent.user != user:
            return Response({"error": "Access denied to unlinked student report cards."}, status=403)

        results = self.get_queryset().filter(
            student_id=student_id,
            examination_subject__examination_id=exam_id
        )

        # STRICT ENFORCEMENT: Students & Parents can ONLY see PUBLISHED results
        if user.role in [UserRole.STUDENT, UserRole.PARENT]:
            results = results.filter(status=ResultStatus.PUBLISHED)

        if not results.exists():
            return Response({
                "error": "No published examination results found for this student and exam session.",
                "pending_publication": True
            }, status=404)

        exam = Examination.objects.filter(id=exam_id).first()
        total_marks = results.aggregate(Sum('marks_obtained'))['marks_obtained__sum'] or Decimal('0.00')
        total_max = results.aggregate(Sum('examination_subject__max_marks'))['examination_subject__max_marks__sum'] or Decimal('0.00')
        avg_pct = results.aggregate(Avg('percentage'))['percentage__avg'] or Decimal('0.00')
        avg_pct = round(avg_pct, 2)

        items = ResultSerializer(results, many=True).data
        overall_grade = Grade.objects.filter(min_score__lte=avg_pct, max_score__gte=avg_pct).order_by('-min_score').first()

        # Calculate total GPA points
        total_gpa_points = sum(r.grade.grade_point for r in results if r.grade)

        return Response({
            "student": {
                "id": str(student.id),
                "admission_number": student.admission_number,
                "name": student.user.get_full_name(),
                "class_name": student.current_class.name if student.current_class else "N/A",
                "stream_name": student.current_stream.name if student.current_stream else "N/A"
            },
            "examination": {
                "id": str(exam.id),
                "name": exam.name,
                "exam_type": exam.get_exam_type_display(),
                "term": exam.term.name,
                "academic_year": exam.academic_year.name,
                "is_published": exam.is_published
            },
            "summary": {
                "total_subjects": results.count(),
                "total_score": round(float(total_marks), 2),
                "total_max_marks": round(float(total_max), 2),
                "average_percentage": round(float(avg_pct), 2),
                "overall_grade": overall_grade.name if overall_grade else "N/A",
                "total_gpa_points": float(total_gpa_points),
                "grade_point": float(overall_grade.grade_point) if overall_grade else 0.0,
                "remark": overall_grade.remark if overall_grade else ""
            },
            "subject_results": items
        })

    @action(detail=False, methods=['get'])
    def subject_ledger(self, request):
        """Returns mark sheet ledger summary and workflow audit for a specific examination subject."""
        exam_subject_id = request.query_params.get('examination_subject_id')
        if not exam_subject_id:
            return Response({"error": "examination_subject_id parameter is required."}, status=400)

        try:
            exam_subject = ExaminationSubject.objects.select_related(
                'examination', 'subject', 'class_obj'
            ).get(id=exam_subject_id)
        except ExaminationSubject.DoesNotExist:
            return Response({"error": "Examination subject not found."}, status=404)

        results = self.get_queryset().filter(examination_subject=exam_subject)
        total = results.count()

        status_counts = {
            "DRAFT": results.filter(status=ResultStatus.DRAFT).count(),
            "SUBMITTED": results.filter(status=ResultStatus.SUBMITTED).count(),
            "VERIFIED": results.filter(status=ResultStatus.VERIFIED).count(),
            "APPROVED": results.filter(status=ResultStatus.APPROVED).count(),
            "PUBLISHED": results.filter(status=ResultStatus.PUBLISHED).count(),
        }

        # Dominant workflow status
        current_status = "NOT_ENTERED"
        if status_counts["PUBLISHED"] == total and total > 0:
            current_status = "PUBLISHED"
        elif status_counts["APPROVED"] > 0:
            current_status = "APPROVED"
        elif status_counts["VERIFIED"] > 0:
            current_status = "VERIFIED"
        elif status_counts["SUBMITTED"] > 0:
            current_status = "SUBMITTED"
        elif total > 0:
            current_status = "DRAFT"

        mean_score = results.aggregate(Avg('marks_obtained'))['marks_obtained__avg'] or Decimal('0.00')
        highest_score = results.aggregate(Max('marks_obtained'))['marks_obtained__max'] or Decimal('0.00')
        lowest_score = results.aggregate(Min('marks_obtained'))['marks_obtained__min'] or Decimal('0.00')
        passed_count = results.filter(is_passed=True).count()
        pass_rate = round((passed_count / total) * 100, 1) if total > 0 else 0.0

        # Latest audit info
        latest_submitted = results.filter(submitted_by__isnull=False).order_by('-submitted_at').first()
        latest_verified = results.filter(verified_by__isnull=False).order_by('-verified_at').first()
        latest_approved = results.filter(approved_by__isnull=False).order_by('-approved_at').first()
        latest_published = results.filter(published_by__isnull=False).order_by('-published_at').first()

        return Response({
            "examination_subject_id": str(exam_subject.id),
            "examination_name": exam_subject.examination.name,
            "subject_name": exam_subject.subject.name,
            "subject_code": exam_subject.subject.code,
            "class_name": exam_subject.class_obj.name,
            "max_marks": float(exam_subject.max_marks),
            "pass_marks": float(exam_subject.pass_marks),
            "total_candidates": total,
            "current_status": current_status,
            "status_breakdown": status_counts,
            "mean_score": round(float(mean_score), 2),
            "highest_score": float(highest_score),
            "lowest_score": float(lowest_score),
            "pass_rate": pass_rate,
            "audit_trail": {
                "submitted_by": latest_submitted.submitted_by.get_full_name() if latest_submitted and latest_submitted.submitted_by else None,
                "submitted_at": latest_submitted.submitted_at if latest_submitted else None,
                "verified_by": latest_verified.verified_by.get_full_name() if latest_verified and latest_verified.verified_by else None,
                "verified_at": latest_verified.verified_at if latest_verified else None,
                "approved_by": latest_approved.approved_by.get_full_name() if latest_approved and latest_approved.approved_by else None,
                "approved_at": latest_approved.approved_at if latest_approved else None,
                "published_by": latest_published.published_by.get_full_name() if latest_published and latest_published.published_by else None,
                "published_at": latest_published.published_at if latest_published else None,
            }
        })
