from core.routers import OptionalSlashRouter
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, ParentViewSet, StudentEnrollmentViewSet

router = OptionalSlashRouter()
router.register(r'records', StudentViewSet, basename='student')
router.register(r'parents', ParentViewSet, basename='parent')
router.register(r'enrollments', StudentEnrollmentViewSet, basename='enrollment')

urlpatterns = [
    path('', include(router.urls)),
]
