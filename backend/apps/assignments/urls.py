from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssignmentViewSet, AssignmentSubmissionViewSet, StudentMyAssignmentsView

router = DefaultRouter()
router.register(r'tasks', AssignmentViewSet, basename='assignment')
router.register(r'submissions', AssignmentSubmissionViewSet, basename='submission')
router.register(r'', AssignmentViewSet, basename='assignment-root')

urlpatterns = [
    path('me/', StudentMyAssignmentsView.as_view(), name='assignments-me'),
    path('', include(router.urls)),
]
