from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeacherViewSet, StaffViewSet

router = DefaultRouter()
router.register(r'teachers', TeacherViewSet, basename='teacher')
router.register(r'members', StaffViewSet, basename='staff')

urlpatterns = [
    path('', include(router.urls)),
]
