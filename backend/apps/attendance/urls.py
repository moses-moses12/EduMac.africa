from core.routers import OptionalSlashRouter
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet, StudentMyAttendanceView

router = OptionalSlashRouter()
router.register(r'records', AttendanceViewSet, basename='attendance')
router.register(r'', AttendanceViewSet, basename='attendance-root')

urlpatterns = [
    path('me/', StudentMyAttendanceView.as_view(), name='attendance-me'),
    path('', include(router.urls)),
]
