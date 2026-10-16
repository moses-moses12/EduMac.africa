from core.routers import OptionalSlashRouter
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TimetableViewSet, StudentMyTimetableView

router = OptionalSlashRouter()
router.register(r'slots', TimetableViewSet, basename='timetable')
router.register(r'', TimetableViewSet, basename='timetable-root')

urlpatterns = [
    path('me/', StudentMyTimetableView.as_view(), name='timetable-me'),
    path('', include(router.urls)),
]
