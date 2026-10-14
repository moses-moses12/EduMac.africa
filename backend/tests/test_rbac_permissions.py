import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole

@pytest.mark.django_db
class TestRBACPermissions:
    def get_client_for_user(self, email):
        client = APIClient()
        login_res = client.post('/api/v1/auth/login/', {
            'email': email,
            'password': 'Password123!'
        }, format='json')
        token = login_res.json()['data']['tokens']['access']
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return client

    def test_admin_can_access_audit_logs(self):
        client = self.get_client_for_user('admin@school.edu')
        res = client.get('/api/v1/audit/logs/')
        assert res.status_code == 200

    def test_student_cannot_access_audit_logs(self):
        client = self.get_client_for_user('student@school.edu')
        res = client.get('/api/v1/audit/logs/')
        assert res.status_code == 403

    def test_teacher_cannot_access_audit_logs(self):
        client = self.get_client_for_user('teacher@school.edu')
        res = client.get('/api/v1/audit/logs/')
        assert res.status_code == 403

    def test_student_sees_only_own_invoices(self):
        client = self.get_client_for_user('student@school.edu')
        res = client.get('/api/v1/fees/invoices/')
        assert res.status_code == 200
        data = res.json()
        results = data.get('results', [])
        for inv in results:
            assert inv['student_admission'] == 'STU-2026-001'

    def test_accountant_can_access_all_invoices(self):
        client = self.get_client_for_user('accountant@school.edu')
        res = client.get('/api/v1/fees/invoices/')
        assert res.status_code == 200

    def test_headmaster_can_access_management_analytics(self):
        client = self.get_client_for_user('headmaster@school.edu')
        res = client.get('/api/v1/reports/headmaster/')
        assert res.status_code == 200
        data = res.json()
        assert 'student_population' in data
        assert 'attendance' in data
        assert 'academic_performance' in data
        assert 'fee_overview' in data
        assert 'teacher_statistics' in data
        assert 'class_performance' in data
        assert 'examination_performance' in data
        assert 'announcements' in data
        assert 'management_reports' in data
        assert 'important_alerts' in data
        assert data['permissions_boundary']['is_technical_admin'] is False

    def test_headmaster_cannot_access_technical_audit_logs(self):
        client = self.get_client_for_user('headmaster@school.edu')
        res = client.get('/api/v1/audit/logs/')
        assert res.status_code == 403

    def test_headmaster_cannot_manage_system_users(self):
        client = self.get_client_for_user('headmaster@school.edu')
        res = client.get('/api/v1/auth/users/')
        assert res.status_code == 403
        post_res = client.post('/api/v1/auth/users/', {
            'email': 'unauthorized@school.edu',
            'role': 'TEACHER',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'Password123!'
        }, format='json')
        assert post_res.status_code == 403

    def test_headmaster_can_broadcast_announcements(self):
        client = self.get_client_for_user('headmaster@school.edu')
        res = client.post('/api/v1/communication/announcements/', {
            'title': 'School Executive Assembly',
            'content': 'All faculty and students to convene in the Main Hall.',
            'priority': 'HIGH',
            'target_roles': 'ALL',
            'is_active': True
        }, format='json')
        assert res.status_code == 201
