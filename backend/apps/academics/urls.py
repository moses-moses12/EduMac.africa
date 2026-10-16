from core.routers import OptionalSlashRouter
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AcademicYearViewSet,
    TermViewSet,
    ClassViewSet,
    StreamViewSet,
    SubjectViewSet,
    TeacherAssignmentViewSet,
    AcademicCalendarViewSet,
)

router = OptionalSlashRouter()
router.register(r'years', AcademicYearViewSet, basename='academic-year')
router.register(r'terms', TermViewSet, basename='term')
router.register(r'classes', ClassViewSet, basename='class')
router.register(r'streams', StreamViewSet, basename='stream')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'assignments', TeacherAssignmentViewSet, basename='teacher-assignment')
router.register(r'calendar', AcademicCalendarViewSet, basename='academic-calendar')

urlpatterns = [
    path('', include(router.urls)),
]
