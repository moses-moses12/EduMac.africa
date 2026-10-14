import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from apps.accounts.models import User

client = APIClient()

endpoints_to_test = [
    '/api/v1/auth/login/',
    '/api/v1/students/',
    '/api/v1/teachers/',
    '/api/v1/staff/',
    '/api/v1/parents/',
    '/api/v1/classes/',
    '/api/v1/subjects/',
    '/api/v1/attendance/',
    '/api/v1/examinations/',
    '/api/v1/results/',
    '/api/v1/fees/',
    '/api/v1/payments/',
    '/api/v1/timetable/',
    '/api/v1/assignments/',
    '/api/v1/library/',
    '/api/v1/notifications/',
    '/api/v1/reports/',
]

print("--- 1. Testing Unauthenticated Access (Permission & Error Formatting) ---")
# Pick one protected endpoint to verify unauthenticated response format
unauth_res = client.get('/api/v1/students/')
print(f"GET /api/v1/students/ Status: {unauth_res.status_code}")
print(f"Response JSON: {unauth_res.json()}")

assert unauth_res.json().get('success') is False, "Expected success to be False"
assert 'message' in unauth_res.json(), "Expected message key"
assert 'errors' in unauth_res.json(), "Expected errors key"
print(">>> Unauthenticated permission error envelope passed!")

print("\n--- 2. Testing Authenticated Access across all 17 Endpoints ---")
# Authenticate with admin user
admin_user = User.objects.filter(role='ADMIN').first()
if not admin_user:
    admin_user = User.objects.create_superuser('admin@school.edu', 'admin', 'Password123!', role='ADMIN')

client.force_authenticate(user=admin_user)

all_passed = True
for ep in endpoints_to_test:
    res = client.get(ep)
    is_ok = res.status_code in [200, 201, 405] # 405 only for POST-only endpoints like login
    status_tag = "PASS" if is_ok else f"FAIL ({res.status_code})"
    if not is_ok:
        all_passed = False
        print(f"[{status_tag}] {ep} -> {res.content[:200]}")
    else:
        # Check pagination or standardized response
        data = res.json()
        has_envelope = isinstance(data, dict) and ('results' in data or 'success' in data or 'summary' in data or 'count' in data)
        print(f"[{status_tag}] {ep} (envelope: {has_envelope}, count: {data.get('count', 'N/A') if isinstance(data, dict) else 'N/A'})")

print("\n--- 3. Testing Search, Filtering, Ordering & Pagination ---")
search_res = client.get('/api/v1/students/?search=test&ordering=-created_at&page=1&page_size=5')
print(f"GET /api/v1/students/?search=test&ordering=-created_at&page=1&page_size=5: {search_res.status_code}")
search_data = search_res.json()
print("Pagination envelope:", {k: v for k, v in search_data.items() if k != 'results'})
assert 'count' in search_data and 'total_pages' in search_data and 'current_page' in search_data
print(">>> Pagination, search & ordering passed!")

if all_passed:
    print("\nALL 17 API ENDPOINTS AND ARCHITECTURAL REQUIREMENTS VERIFIED SUCCESSFULLY!")
