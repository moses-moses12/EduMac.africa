from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.models import UserRole
from apps.students.models import Student
from core.permissions import IsAcademicOfficer
from .models import Timetable
from .serializers import TimetableSerializer

class StudentMyTimetableView(APIView):
    """
    Self-service endpoint deriving timetable strictly from student's active stream.
    STRICT ENFORCEMENT: Parents can only access their explicitly linked children.
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

        slots = []
        if student.current_stream:
            timetable_qs = Timetable.objects.filter(stream=student.current_stream).select_related(
                'subject', 'teacher__user', 'stream__class_obj'
            ).order_by('day_of_week', 'start_time')
            slots = TimetableSerializer(timetable_qs, many=True).data

        return Response({
            "student_id": str(student.id),
            "student_name": student.user.get_full_name(),
            "student_admission": student.admission_number,
            "class_name": student.current_class.name if student.current_class else "N/A",
            "class_stream": student.current_stream.name if student.current_stream else "General",
            "linked_children": linked_children,
            "slots": slots
        })

class TimetableBasePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return IsAcademicOfficer().has_permission(request, view)

class TimetableViewSet(viewsets.ModelViewSet):
    serializer_class = TimetableSerializer
    permission_classes = [TimetableBasePermission]
    filterset_fields = ['stream', 'teacher', 'day_of_week', 'subject']

    def get_queryset(self):
        user = self.request.user
        qs = Timetable.objects.all().select_related('stream__class_obj', 'subject', 'teacher__user')

        # Role-based convenience filtering
        if user.role == UserRole.STUDENT and hasattr(user, 'student_profile') and user.student_profile.current_stream:
            if not self.request.query_params.get('all'):
                return qs.filter(stream=user.student_profile.current_stream)
        elif user.role == UserRole.PARENT and hasattr(user, 'parent_profile'):
            child_streams = user.parent_profile.children.filter(current_stream__isnull=False).values_list('current_stream_id', flat=True)
            return qs.filter(stream_id__in=child_streams)
        elif user.role == UserRole.TEACHER and hasattr(user, 'teacher_profile'):
            teacher = user.teacher_profile
            from django.db.models import Q
            assigned_streams = teacher.teaching_assignments.filter(stream__isnull=False).values_list('stream_id', flat=True)
            assigned_classes = teacher.teaching_assignments.values_list('class_obj_id', flat=True)
            if self.request.query_params.get('my_schedule'):
                return qs.filter(teacher=teacher)
            return qs.filter(
                Q(teacher=teacher) |
                Q(stream_id__in=assigned_streams) |
                Q(stream__class_obj_id__in=assigned_classes)
            ).distinct()

        return qs
