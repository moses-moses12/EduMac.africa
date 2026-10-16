from core.routers import OptionalSlashRouter
from django.contrib import admin
from django.urls import path, re_path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from apps.students.views import StudentViewSet, ParentViewSet
from apps.staff.views import TeacherViewSet, StaffViewSet
from apps.academics.views import ClassViewSet, SubjectViewSet
from apps.fees.views import PaymentViewSet

# Direct top-level resource router for unified API design
v1_direct_router = OptionalSlashRouter()
v1_direct_router.register(r'students', StudentViewSet, basename='v1-student')
v1_direct_router.register(r'teachers', TeacherViewSet, basename='v1-teacher')
v1_direct_router.register(r'staff', StaffViewSet, basename='v1-staff')
v1_direct_router.register(r'parents', ParentViewSet, basename='v1-parent')
v1_direct_router.register(r'classes', ClassViewSet, basename='v1-class')
v1_direct_router.register(r'subjects', SubjectViewSet, basename='v1-subject')
v1_direct_router.register(r'payments', PaymentViewSet, basename='v1-payment')

urlpatterns = [
    path('admin/', admin.site.urls),

    # OpenAPI 3 Schema & Swagger UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Direct top-level v1 endpoints (/api/v1/teachers/, /api/v1/classes/, etc.)
    re_path(r'^api/v1/(?:/)?', include(v1_direct_router.urls)),

    # Module-scoped API v1 endpoints
    re_path(r'^api/v1/auth(?:/)?', include('apps.accounts.urls')),
    re_path(r'^api/v1/academics(?:/)?', include('apps.academics.urls')),
    re_path(r'^api/v1/students(?:/)?', include('apps.students.urls')),
    re_path(r'^api/v1/staff(?:/)?', include('apps.staff.urls')),
    re_path(r'^api/v1/attendance(?:/)?', include('apps.attendance.urls')),
    re_path(r'^api/v1/examinations(?:/)?', include('apps.examinations.urls')),
    re_path(r'^api/v1/results(?:/)?', include('apps.results.urls')),
    re_path(r'^api/v1/fees(?:/)?', include('apps.fees.urls')),
    re_path(r'^api/v1/timetable(?:/)?', include('apps.timetable.urls')),
    re_path(r'^api/v1/assignments(?:/)?', include('apps.assignments.urls')),
    re_path(r'^api/v1/library(?:/)?', include('apps.library.urls')),
    re_path(r'^api/v1/notifications(?:/)?', include('apps.notifications.urls')),
    re_path(r'^api/v1/communication(?:/)?', include('apps.communication.urls')),
    re_path(r'^api/v1/reports(?:/)?', include('apps.reports.urls')),
    re_path(r'^api/v1/audit(?:/)?', include('apps.audit.urls')),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

