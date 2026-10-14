from rest_framework import viewsets, permissions
from core.permissions import IsAcademicOfficer
from .models import AcademicYear, Term, Class, Stream, Subject, TeacherAssignment, AcademicCalendar
from .serializers import (
    AcademicYearSerializer,
    TermSerializer,
    ClassSerializer,
    StreamSerializer,
    SubjectSerializer,
    TeacherAssignmentSerializer,
    AcademicCalendarSerializer,
)

class AcademicBasePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return IsAcademicOfficer().has_permission(request, view)

class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all().prefetch_related('terms')
    serializer_class = AcademicYearSerializer
    permission_classes = [AcademicBasePermission]
    search_fields = ['name']

class TermViewSet(viewsets.ModelViewSet):
    queryset = Term.objects.all().select_related('academic_year')
    serializer_class = TermSerializer
    permission_classes = [AcademicBasePermission]
    filterset_fields = ['academic_year', 'is_current']
    search_fields = ['name']

class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all().prefetch_related('streams')
    serializer_class = ClassSerializer
    permission_classes = [AcademicBasePermission]
    search_fields = ['name', 'code', 'academic_stage']
    ordering_fields = ['order', 'name']

class StreamViewSet(viewsets.ModelViewSet):
    queryset = Stream.objects.all().select_related('class_obj')
    serializer_class = StreamSerializer
    permission_classes = [AcademicBasePermission]
    filterset_fields = ['class_obj']
    search_fields = ['name', 'class_obj__name']

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    filterset_fields = ['department', 'is_elective']
    search_fields = ['name', 'code', 'department']

class TeacherAssignmentViewSet(viewsets.ModelViewSet):
    queryset = TeacherAssignment.objects.all().select_related(
        'teacher__user', 'subject', 'class_obj', 'stream', 'academic_year', 'term'
    )
    serializer_class = TeacherAssignmentSerializer
    permission_classes = [AcademicBasePermission]
    filterset_fields = ['teacher', 'subject', 'class_obj', 'stream', 'academic_year', 'term', 'is_class_teacher']
    search_fields = [
        'teacher__user__first_name', 'teacher__user__last_name',
        'subject__name', 'subject__code', 'class_obj__name', 'stream__name'
    ]

class AcademicCalendarViewSet(viewsets.ModelViewSet):
    queryset = AcademicCalendar.objects.all().select_related('academic_year', 'term')
    serializer_class = AcademicCalendarSerializer
    permission_classes = [AcademicBasePermission]
    filterset_fields = ['academic_year', 'term', 'event_type', 'is_public']
    search_fields = ['title', 'description']
