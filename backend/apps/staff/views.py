from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import IsHeadmaster
from .models import Teacher, Staff
from .serializers import TeacherSerializer, StaffSerializer

class StaffBasePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return IsHeadmaster().has_permission(request, view)

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all().select_related('user')
    serializer_class = TeacherSerializer
    permission_classes = [StaffBasePermission]
    search_fields = ['employee_id', 'user__first_name', 'user__last_name', 'user__email', 'specialization']
    filterset_fields = ['is_active', 'specialization']

    def get_queryset(self):
        user = self.request.user
        return self.queryset

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Returns the teacher profile and all assigned classes, streams, and subjects."""
        teacher = getattr(request.user, 'teacher_profile', None)
        if not teacher:
            return Response({"error": "Teacher profile not found for this account."}, status=status.HTTP_404_NOT_FOUND)

        assignments = teacher.teaching_assignments.select_related('class_obj', 'stream', 'subject', 'academic_year', 'term')

        classes_map = {}
        streams_map = {}
        subjects_map = {}
        assignments_data = []

        for a in assignments:
            if a.class_obj:
                classes_map[str(a.class_obj.id)] = {
                    "id": str(a.class_obj.id),
                    "name": a.class_obj.name,
                    "code": a.class_obj.code
                }
            if a.stream:
                streams_map[str(a.stream.id)] = {
                    "id": str(a.stream.id),
                    "name": a.stream.name,
                    "class_id": str(a.class_obj.id) if a.class_obj else None,
                    "class_name": a.class_obj.name if a.class_obj else ""
                }
            if a.subject:
                subjects_map[str(a.subject.id)] = {
                    "id": str(a.subject.id),
                    "name": a.subject.name,
                    "code": a.subject.code,
                    "department": a.subject.department
                }
            assignments_data.append({
                "id": str(a.id),
                "class_id": str(a.class_obj.id) if a.class_obj else None,
                "class_name": a.class_obj.name if a.class_obj else "",
                "stream_id": str(a.stream.id) if a.stream else None,
                "stream_name": a.stream.name if a.stream else "All Streams",
                "subject_id": str(a.subject.id) if a.subject else None,
                "subject_name": a.subject.name if a.subject else "",
                "subject_code": a.subject.code if a.subject else "",
                "is_class_teacher": a.is_class_teacher,
                "periods_per_week": a.periods_per_week
            })

        from rest_framework.response import Response
        return Response({
            "profile": TeacherSerializer(teacher).data,
            "classes": list(classes_map.values()),
            "streams": list(streams_map.values()),
            "subjects": list(subjects_map.values()),
            "assignments": assignments_data,
        })

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all().select_related('user')
    serializer_class = StaffSerializer
    permission_classes = [StaffBasePermission]
    search_fields = ['employee_id', 'user__first_name', 'user__last_name', 'department', 'designation']
    filterset_fields = ['is_active', 'department']
