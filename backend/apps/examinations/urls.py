from core.routers import OptionalSlashRouter
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GradeViewSet,
    ExaminationTypeViewSet,
    ExaminationPeriodViewSet,
    ExaminationCandidateViewSet,
    ExaminationViewSet,
    ExaminationSubjectViewSet
)

router = OptionalSlashRouter()
router.register(r'grades', GradeViewSet, basename='grade')
router.register(r'types', ExaminationTypeViewSet, basename='examination-type')
router.register(r'periods', ExaminationPeriodViewSet, basename='examination-period')
router.register(r'candidates', ExaminationCandidateViewSet, basename='examination-candidate')
router.register(r'subjects', ExaminationSubjectViewSet, basename='exam-subject')
router.register(r'schedules', ExaminationSubjectViewSet, basename='exam-schedule')
router.register(r'sessions', ExaminationViewSet, basename='examination')
router.register(r'', ExaminationViewSet, basename='examination-root')

urlpatterns = [
    path('', include(router.urls)),
]
