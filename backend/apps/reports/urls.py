from django.urls import path
from .views import (
    ExecutiveDashboardReportView,
    AcademicPerformanceReportView,
    EnrollmentAnalyticsView,
    HeadmasterAnalyticsView,
    AdvancedAnalyticsReportView,
)

urlpatterns = [
    path('', ExecutiveDashboardReportView.as_view(), name='report-root'),
    path('executive/', ExecutiveDashboardReportView.as_view(), name='report-executive'),
    path('academic/', AcademicPerformanceReportView.as_view(), name='report-academic'),
    path('enrollment/', EnrollmentAnalyticsView.as_view(), name='report-enrollment'),
    path('headmaster/', HeadmasterAnalyticsView.as_view(), name='report-headmaster'),
    path('analytics/', AdvancedAnalyticsReportView.as_view(), name='report-analytics'),
]
