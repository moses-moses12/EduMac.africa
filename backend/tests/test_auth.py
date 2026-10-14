import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole

@pytest.mark.django_db
class TestAuthentication:
    def test_login_success(self):
        client = APIClient()
        response = client.post('/api/v1/auth/login/', {
            'email': 'admin@school.edu',
            'password': 'Password123!'
        }, format='json')

        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'tokens' in data['data']
        assert 'access' in data['data']['tokens']
        assert 'refresh' in data['data']['tokens']
        assert data['data']['user']['email'] == 'admin@school.edu'
        assert data['data']['user']['role'] == UserRole.ADMIN

    def test_login_invalid_password(self):
        client = APIClient()
        response = client.post('/api/v1/auth/login/', {
            'email': 'admin@school.edu',
            'password': 'WrongPassword999!'
        }, format='json')

        assert response.status_code == 400
        data = response.json()
        assert data['success'] is False

    def test_current_user_me(self):
        client = APIClient()
        login_res = client.post('/api/v1/auth/login/', {
            'email': 'teacher@school.edu',
            'password': 'Password123!'
        }, format='json')
        token = login_res.json()['data']['tokens']['access']

        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = client.get('/api/v1/auth/me/')

        assert response.status_code == 200
        data = response.json()
        assert data['data']['email'] == 'teacher@school.edu'
        assert data['data']['role'] == UserRole.TEACHER

    def test_token_refresh(self):
        client = APIClient()
        login_res = client.post('/api/v1/auth/login/', {
            'email': 'student@school.edu',
            'password': 'Password123!'
        }, format='json')
        refresh_token = login_res.json()['data']['tokens']['refresh']

        response = client.post('/api/v1/auth/refresh/', {
            'refresh': refresh_token
        }, format='json')

        assert response.status_code == 200
        assert 'access' in response.json()
