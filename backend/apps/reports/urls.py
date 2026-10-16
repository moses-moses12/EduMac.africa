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
    path('executive', ExecutiveDashboardReportView.as_view(), name='report-executive-noslash'),
    path('academic/', AcademicPerformanceReportView.as_view(), name='report-academic'),
    path('academic', AcademicPerformanceReportView.as_view(), name='report-academic-noslash'),
    path('enrollment/', EnrollmentAnalyticsView.as_view(), name='report-enrollment'),
    path('enrollment', EnrollmentAnalyticsView.as_view(), name='report-enrollment-noslash'),
    path('headmaster/', HeadmasterAnalyticsView.as_view(), name='report-headmaster'),
    path('headmaster', HeadmasterAnalyticsView.as_view(), name='report-headmaster-noslash'),
    path('analytics/', AdvancedAnalyticsReportView.as_view(), name='report-analytics'),
    path('analytics', AdvancedAnalyticsReportView.as_view(), name='report-analytics-noslash'),
]
