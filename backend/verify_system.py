import os
import django
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from apps.accounts.models import User
from apps.reports.views import ExecutiveDashboardReportView, AdvancedAnalyticsReportView
from apps.notifications.views import NotificationViewSet
from rest_framework.test import force_authenticate

def test_system():
    factory = RequestFactory()
    admin_user = User.objects.filter(role='ADMIN').first()
    print(f"Testing with admin user: {admin_user.email}")

    # 1. Test NotificationViewSet
    view = NotificationViewSet.as_view({'get': 'list'})
    req = factory.get('/api/v1/notifications/')
    force_authenticate(req, user=admin_user)
    resp = view(req)
    results = resp.data.get('results', [])
    print(f"Notifications list status: {resp.status_code}, count: {len(results)}")
    if results:
        first = results[0]
        print(f"Notification fields check:")
        print(f"  title: {first.get('title')}")
        print(f"  message: {first.get('message')}")
        print(f"  type: {first.get('type')}")
        print(f"  recipient: {first.get('recipient')}")
        print(f"  is_read: {first.get('is_read')}")
        print(f"  created_at: {first.get('created_at')}")

    # 2. Test Unread Count
    view_count = NotificationViewSet.as_view({'get': 'unread_count'})
    req_count = factory.get('/api/v1/notifications/unread-count/')
    force_authenticate(req_count, user=admin_user)
    resp_count = view_count(req_count)
    print(f"Unread count endpoint: status {resp_count.status_code}, data: {resp_count.data}")

    # 3. Test Mark as read
    if results:
        notif_id = results[0]['id']
        view_read = NotificationViewSet.as_view({'post': 'mark_as_read'})
        req_read = factory.post(f'/api/v1/notifications/{notif_id}/read/')
        force_authenticate(req_read, user=admin_user)
        resp_read = view_read(req_read, pk=notif_id)
        print(f"Mark as read endpoint: status {resp_read.status_code}, data: {resp_read.data}")

    # 4. Performance benchmark: Executive Report
    rep_view = ExecutiveDashboardReportView.as_view()
    req_rep = factory.get('/api/v1/reports/executive/')
    force_authenticate(req_rep, user=admin_user)
    
    t0 = time.perf_counter()
    resp_rep1 = rep_view(req_rep)
    t1 = time.perf_counter()
    resp_rep2 = rep_view(req_rep)
    t2 = time.perf_counter()
    print(f"Executive Report -> Run 1 (DB Aggregation): {(t1 - t0)*1000:.2f}ms | Run 2 (LocMem Cached): {(t2 - t1)*1000:.2f}ms")
    print(f"Metrics: {resp_rep1.data.get('metrics')}")

    # 5. Performance benchmark: Advanced Analytics
    adv_view = AdvancedAnalyticsReportView.as_view()
    req_adv = factory.get('/api/v1/reports/analytics/')
    force_authenticate(req_adv, user=admin_user)

    t0 = time.perf_counter()
    resp_adv1 = adv_view(req_adv)
    t1 = time.perf_counter()
    resp_adv2 = adv_view(req_adv)
    t2 = time.perf_counter()
    print(f"Advanced Analytics -> Run 1 (DB): {(t1 - t0)*1000:.2f}ms | Run 2 (LocMem Cached): {(t2 - t1)*1000:.2f}ms")

if __name__ == '__main__':
    test_system()
