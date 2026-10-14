import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from apps.accounts.models import User, UserRole
from apps.accounts.views import LoginView, UserViewSet, CurrentUserView

def verify_all_endpoints():
    factory = APIRequestFactory()

    admin_user = User.objects.get(role=UserRole.ADMIN, email="admin@school.edu")
    teacher_user = User.objects.get(role=UserRole.TEACHER, email="teacher@school.edu")

    print(f"=== 1. VERIFYING LOGIN VIEW FOR ALL 10 ROLES ===")
    roles = [
        ("admin", "admin@school.edu", UserRole.ADMIN),
        ("headmaster", "headmaster@school.edu", UserRole.HEADMASTER),
        ("academic", "academic@school.edu", UserRole.ACADEMIC),
        ("teacher", "teacher@school.edu", UserRole.TEACHER),
        ("student", "student@school.edu", UserRole.STUDENT),
        ("parent", "parent@school.edu", UserRole.PARENT),
        ("accountant", "accountant@school.edu", UserRole.ACCOUNTANT),
        ("librarian", "librarian@school.edu", UserRole.LIBRARIAN),
        ("exam", "exam@school.edu", UserRole.EXAM_OFFICER),
        ("staff", "staff@school.edu", UserRole.STAFF),
    ]

    login_view = LoginView.as_view()
    
    for uname, email, role in roles:
        # Test username login
        req_u = factory.post("/api/v1/auth/login/", {"username": uname, "password": "Password123!"}, format="json")
        resp_u = login_view(req_u)
        assert resp_u.status_code == 200, f"Failed username login for {uname}: {resp_u.data}"

        # Test email login
        req_e = factory.post("/api/v1/auth/login/", {"email": email, "password": "Password123!"}, format="json")
        resp_e = login_view(req_e)
        assert resp_e.status_code == 200, f"Failed email login for {email}: {resp_e.data}"

        print(f" [OK] Role {role:<12} authenticated successfully via username '{uname}' & email '{email}'")

    print("\n=== 2. VERIFYING ADMIN SET-PASSWORD ACTION ON USERVIEWSET ===")
    user_viewset = UserViewSet.as_view({"post": "set_password"})
    req_set_pwd = factory.post(f"/api/v1/auth/users/{teacher_user.id}/set-password/", {"password": "Password123!"}, format="json")
    force_authenticate(req_set_pwd, user=admin_user)
    resp_set_pwd = user_viewset(req_set_pwd, pk=str(teacher_user.id))
    print(f"Set Password status: {resp_set_pwd.status_code}, data: {resp_set_pwd.data}")
    assert resp_set_pwd.status_code == 200, f"Set password failed: {resp_set_pwd.data}"

    print("\n=== 3. VERIFYING CURRENT USER PROFILE PATCH ===")
    me_view = CurrentUserView.as_view()
    req_patch = factory.patch("/api/v1/auth/me/", {"phone_number": "+255-700-111222"}, format="json")
    force_authenticate(req_patch, user=teacher_user)
    resp_patch = me_view(req_patch)
    print(f"Profile Patch status: {resp_patch.status_code}, data: {resp_patch.data}")
    assert resp_patch.status_code == 200, f"Profile patch failed: {resp_patch.data}"

    print("\nALL SYSTEM VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    verify_all_endpoints()
