from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.models import UserRole
from .models import Parent, Student, StudentEnrollment
from .serializers import ParentSerializer, StudentSerializer, StudentEnrollmentSerializer

class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['current_class', 'current_stream', 'gender', 'is_active', 'status', 'academic_year']
    search_fields = ['admission_number', 'user__first_name', 'user__last_name', 'user__email', 'phone_number']

    def get_queryset(self):
        user = self.request.user
        queryset = Student.objects.all().select_related('user', 'parent__user', 'current_class', 'current_stream', 'academic_year')

        if user.role == UserRole.STUDENT:
            return queryset.filter(user=user)
        elif user.role == UserRole.PARENT:
            return queryset.filter(parent__user=user)
        elif user.role == UserRole.TEACHER:
            teacher = getattr(user, 'teacher_profile', None)
            if not teacher:
                return queryset.none()
            assigned_classes = teacher.teaching_assignments.values_list('class_obj_id', flat=True)
            assigned_streams = teacher.teaching_assignments.filter(stream__isnull=False).values_list('stream_id', flat=True)
            from django.db.models import Q
            return queryset.filter(
                Q(current_class_id__in=assigned_classes) | Q(current_stream_id__in=assigned_streams)
            ).distinct()
        return queryset

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Quick endpoint for authenticated student to get their profile."""
        student = Student.objects.filter(user=request.user).first()
        if not student:
            return Response({"error": "No student profile found for this account."}, status=404)
        return Response(StudentSerializer(student).data)

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """Transition a student's institutional status (ACTIVE, GRADUATED, SUSPENDED, etc.)."""
        student = self.get_object()
        new_status = request.data.get('status')
        if not new_status or new_status not in dict(student._meta.get_field('status').choices):
            return Response({"error": f"Invalid status '{new_status}' provided."}, status=400)

        student.status = new_status
        student.save()
        return Response({
            "success": True,
            "message": f"Student {student.admission_number} status updated to {new_status}.",
            "student": StudentSerializer(student).data
        })

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Aggregate institutional student status & demographic metrics."""
        qs = self.get_queryset()
        total = qs.count()
        active = qs.filter(status='ACTIVE').count()
        graduated = qs.filter(status='GRADUATED').count()
        transferred = qs.filter(status='TRANSFERRED').count()
        suspended = qs.filter(status='SUSPENDED').count()
        archived = qs.filter(status='ARCHIVED').count()
        inactive = qs.filter(status='INACTIVE').count()

        return Response({
            "total_students": total,
            "active": active,
            "inactive": inactive,
            "graduated": graduated,
            "transferred": transferred,
            "suspended": suspended,
            "archived": archived,
            "gender_breakdown": {
                "male": qs.filter(gender='MALE').count(),
                "female": qs.filter(gender='FEMALE').count(),
                "other": qs.filter(gender='OTHER').count(),
            }
        })

class ParentViewSet(viewsets.ModelViewSet):
    queryset = Parent.objects.all().select_related('user')
    serializer_class = ParentSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'alternate_phone']

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.PARENT:
            return Parent.objects.filter(user=user)
        return Parent.objects.all().select_related('user')

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Endpoint for authenticated parent to retrieve their profile and linked children."""
        parent = Parent.objects.filter(user=request.user).first()
        if not parent:
            return Response({"error": "No parent profile found for this account."}, status=404)
        return Response(ParentSerializer(parent).data)

    @action(detail=False, methods=['get'])
    def children(self, request):
        """Explicit endpoint returning only the children linked to the authenticated parent."""
        parent = Parent.objects.filter(user=request.user).first()
        if not parent:
            return Response({"error": "No parent profile found for this account."}, status=404)
        children = parent.children.all().select_related('user', 'current_class', 'current_stream', 'academic_year')
        return Response({
            "parent_id": str(parent.id),
            "parent_name": parent.user.get_full_name(),
            "total_children": children.count(),
            "children": StudentSerializer(children, many=True).data
        })

class StudentEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = StudentEnrollment.objects.all().select_related('student__user', 'academic_year', 'class_obj', 'stream')
    serializer_class = StudentEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['academic_year', 'class_obj', 'stream', 'status']
    search_fields = ['student__admission_number', 'student__user__first_name', 'student__user__last_name']
