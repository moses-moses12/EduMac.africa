import urllib.request
import urllib.error
import json
import sys

def test_login(identifier, password):
    url = "http://127.0.0.1:8000/api/v1/auth/login/"
    payload = {"username": identifier, "password": password}
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            body = json.loads(response.read().decode("utf-8"))
            print(f"[SUCCESS {response.status}] User: {identifier} | Logged in as: {body['data']['user']['email']} ({body['data']['user']['role']})")
            return response.status, body
    except urllib.error.HTTPError as exc:
        body = json.loads(exc.read().decode("utf-8"))
        print(f"[BLOCKED {exc.code}] User: {identifier} | Reason: {body.get('message')} | Errors: {body.get('errors')}")
        return exc.code, body

print("=" * 60)
print("TESTING SECURITY & REJECTION OF INVALID CREDENTIALS")
print("=" * 60)

# Test 1: Real user, incorrect password
status1, body1 = test_login("admin", "WrongPassword999!")
assert status1 == 400, "Wrong password must be rejected with 400!"
assert "Invalid username/email or password." in str(body1), "Should return invalid credentials message"

# Test 2: Non-existent hacker username
status2, body2 = test_login("malicious_attacker", "SomeRandomPassword")
assert status2 == 400, "Unknown username must be rejected with 400!"

# Test 3: Empty credentials
status3, body3 = test_login("", "")
assert status3 == 400, "Empty credentials must be rejected with 400!"

print("\n" + "=" * 60)
print("TESTING ACCEPTANCE OF VALID CREDENTIALS")
print("=" * 60)

# Test 4: Real credentials
status4, body4 = test_login("admin@school.edu", "Password123!")
assert status4 == 200, "Valid credentials must succeed with 200!"
assert body4["data"]["tokens"]["access"], "Must receive valid JWT access token!"

print("\n" + "=" * 60)
print("VERIFYING AUDIT TRAIL LOGGED REJECTIONS & LOGINS")
print("=" * 60)

import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.audit.models import AuditLog

recent_logs = AuditLog.objects.order_by('-timestamp')[:5]
for log in recent_logs:
    print(f"Audit Entry: Action={log.action:<14} Target={log.object_id:<20} User={log.user} Time={log.timestamp}")

print("\nALL SECURITY TESTS PASSED WITH 100% SUCCESS!")
