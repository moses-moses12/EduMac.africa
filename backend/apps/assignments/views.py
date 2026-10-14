from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.models import UserRole
from apps.staff.models import Teacher
from apps.students.models import Student
from core.permissions import IsTeacher
from .models import Assignment, AssignmentSubmission, SubmissionStatus
from .serializers import AssignmentSerializer, AssignmentSubmissionSerializer

class StudentMyAssignmentsView(APIView):
    """
    Self-service endpoint deriving student identity strictly from the authenticated session.
    STRICT ENFORCEMENT: Parents can only access coursework for their explicitly linked children.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = None
        linked_children = []

        if request.user.role == UserRole.STUDENT:
            student = Student.objects.filter(user=request.user).first()
        elif request.user.role == UserRole.PARENT:
            parent_profile = getattr(request.user, 'parent_profile', None)
            if not parent_profile:
                return Response({"error": "No parent profile associated with this account."}, status=status.HTTP_404_NOT_FOUND)
            children = parent_profile.children.all().select_related('user', 'current_class', 'current_stream')
            linked_children = [
                {
                    "id": str(c.id),
                    "admission_number": c.admission_number,
                    "name": c.user.get_full_name(),
                    "class_name": c.current_class.name if c.current_class else "N/A",
                    "stream_name": c.current_stream.name if c.current_stream else "N/A"
                } for c in children
            ]
            requested_student_id = request.query_params.get('student_id')
            if requested_student_id:
                student = children.filter(id=requested_student_id).first()
                if not student:
                    return Response({"error": "Child not found or not linked to your parent account."}, status=status.HTTP_404_NOT_FOUND)
            else:
                student = children.first()
        else:
            return Response({"error": "This endpoint is restricted to authenticated students and guardians."}, status=status.HTTP_403_FORBIDDEN)

        if not student:
            return Response({"error": "No student profile associated with this account."}, status=status.HTTP_404_NOT_FOUND)

        assignments = Assignment.objects.none()
        if student.current_stream:
            assignments = Assignment.objects.filter(stream=student.current_stream).select_related('subject', 'stream', 'teacher__user')

        submissions = AssignmentSubmission.objects.filter(student=student)
        submission_map = {sub.assignment_id: sub for sub in submissions}

        data = []
        for a in assignments:
            sub = submission_map.get(a.id)
            data.append({
                "id": str(a.id),
                "title": a.title,
                "description": a.description,
                "subject_name": a.subject.name,
                "due_date": a.due_date,
                "max_marks": float(a.max_marks),
                "max_score": float(a.max_marks),
                "submission_status": sub.status if sub else "NOT_SUBMITTED",
                "marks_awarded": float(sub.marks_awarded) if sub and sub.marks_awarded is not None else None,
                "feedback": sub.feedback if sub else None,
            })

        return Response({
            "student_id": str(student.id),
            "student_name": student.user.get_full_name(),
            "student_admission": student.admission_number,
            "class_name": student.current_class.name if student.current_class else "N/A",
            "stream_name": student.current_stream.name if student.current_stream else "N/A",
            "class_stream": f"{student.current_class.name if student.current_class else ''} {student.current_stream.name if student.current_stream else ''}".strip(),
            "linked_children": linked_children,
            "total_assignments": len(data),
            "assignments": data
        })


class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['stream', 'subject', 'teacher']
    search_fields = ['title', 'description', 'subject__name']

    def get_queryset(self):
        user = self.request.user
        qs = Assignment.objects.all().select_related('subject', 'stream', 'teacher__user').prefetch_related('submissions')

        if user.role == UserRole.STUDENT and hasattr(user, 'student_profile') and user.student_profile.current_stream:
            return qs.filter(stream=user.student_profile.current_stream)
        elif user.role == UserRole.PARENT and hasattr(user, 'parent_profile'):
            child_streams = user.parent_profile.children.filter(current_stream__isnull=False).values_list('current_stream_id', flat=True)
            return qs.filter(stream_id__in=child_streams)
        elif user.role == UserRole.TEACHER and hasattr(user, 'teacher_profile'):
            teacher = user.teacher_profile
            from django.db.models import Q
            assigned_streams = teacher.teaching_assignments.filter(stream__isnull=False).values_list('stream_id', flat=True)
            assigned_classes = teacher.teaching_assignments.values_list('class_obj_id', flat=True)
            if self.request.query_params.get('my_assignments'):
                return qs.filter(teacher=teacher)
            return qs.filter(
                Q(teacher=teacher) |
                Q(stream_id__in=assigned_streams) |
                Q(stream__class_obj_id__in=assigned_classes)
            ).distinct()

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        teacher = getattr(user, 'teacher_profile', None)
        if user.role == UserRole.TEACHER:
            if not teacher:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Teacher profile not found.")
            stream = serializer.validated_data.get('stream')
            subject = serializer.validated_data.get('subject')
            from django.db.models import Q
            is_assigned = teacher.teaching_assignments.filter(
                Q(stream=stream) | Q(class_obj=stream.class_obj),
                subject=subject
            ).exists()
            if not is_assigned:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Access Denied: You cannot create assignments for classes or subjects you are not assigned to.")
            serializer.save(teacher=teacher)
        else:
            if not teacher:
                teacher = Teacher.objects.first()
            serializer.save(teacher=teacher)

class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['assignment', 'status', 'student']

    def get_queryset(self):
        user = self.request.user
        qs = AssignmentSubmission.objects.all().select_related('assignment', 'student__user')
        student_id = self.request.query_params.get('student_id')

        if user.role == UserRole.STUDENT:
            return qs.filter(student__user=user)
        elif user.role == UserRole.PARENT:
            qs = qs.filter(student__parent__user=user)
            if student_id:
                qs = qs.filter(student_id=student_id)
            return qs
        elif user.role == UserRole.TEACHER and hasattr(user, 'teacher_profile'):
            return qs.filter(assignment__teacher=user.teacher_profile)

        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def perform_create(self, serializer):
        student = getattr(self.request.user, 'student_profile', None)
        if not student:
            student = Student.objects.first()
        serializer.save(student=student, status=SubmissionStatus.SUBMITTED)

    @action(detail=True, methods=['post'], permission_classes=[IsTeacher])
    def grade(self, request, pk=None):
        """Allows a teacher to score coursework and post feedback comments."""
        submission = self.get_object()
        marks = request.data.get('marks_awarded')
        feedback = request.data.get('feedback', '')

        if marks is None:
            return Response({"error": "marks_awarded is required."}, status=status.HTTP_400_BAD_REQUEST)

        submission.marks_awarded = marks
        submission.feedback = feedback
        submission.status = SubmissionStatus.GRADED
        submission.save()

        return Response(AssignmentSubmissionSerializer(submission).data)
