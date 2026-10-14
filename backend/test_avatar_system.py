import os
import io
import django
from PIL import Image

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.accounts.models import User, UserRole
from apps.accounts.views import AvatarView, CurrentUserView, UserViewSet

def create_test_image(format='PNG', size=(100, 100), color=(70, 130, 180)):
    file_obj = io.BytesIO()
    image = Image.new('RGB', size, color=color)
    image.save(file_obj, format=format)
    file_obj.seek(0)
    return file_obj.getvalue()

def run_tests():
    print("=== STARTING AVATAR SYSTEM BACKEND TEST SUITE ===")
    factory = APIRequestFactory()

    # Retrieve test users
    admin = User.objects.filter(role=UserRole.ADMIN).first()
    student = User.objects.filter(role=UserRole.STUDENT).first()
    teacher = User.objects.filter(role=UserRole.TEACHER).first()
    parent = User.objects.filter(role=UserRole.PARENT).first()

    avatar_view = AvatarView.as_view()
    me_view = CurrentUserView.as_view()
    user_viewset = UserViewSet.as_view({'post': 'manage_user_avatar', 'delete': 'manage_user_avatar'})

    # 1. Unauthenticated requests to /api/v1/auth/me/ are rejected
    req = factory.get('/api/v1/auth/me/')
    resp = me_view(req)
    assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
    print("[PASS] 1. Unauthenticated request to /auth/me/ rejected (401)")

    # 2. Unauthenticated requests to avatar endpoint are rejected
    req = factory.post('/api/v1/auth/profile/avatar/')
    resp = avatar_view(req)
    assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
    print("[PASS] 2. Unauthenticated request to avatar upload rejected (401)")

    # 3. Authenticated user retrieves their own profile
    req = factory.get('/api/v1/auth/me/')
    force_authenticate(req, user=student)
    resp = me_view(req)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    assert resp.data['data']['email'] == student.email
    assert 'avatar_url' in resp.data['data']
    print("[PASS] 3. Authenticated user successfully retrieves their own profile")

    # 4. Valid PNG image upload succeeds
    png_bytes = create_test_image(format='PNG', size=(200, 200), color=(34, 197, 94))
    upload_file = SimpleUploadedFile("avatar.png", png_bytes, content_type="image/png")
    req = factory.post('/api/v1/auth/profile/avatar/', {'avatar': upload_file}, format='multipart')
    force_authenticate(req, user=student)
    resp = avatar_view(req)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.data}"
    avatar_url = resp.data['data']['avatar_url']
    assert avatar_url is not None and "avatars" in avatar_url, f"Invalid avatar_url: {avatar_url}"
    student.refresh_from_db()
    assert bool(student.avatar), "User avatar field was not set"
    old_avatar_path = student.avatar.path if student.avatar else None
    print(f"[PASS] 4. Valid PNG image upload succeeded (url: {avatar_url})")

    # 5. Image replacement works & old file is cleaned up
    jpg_bytes = create_test_image(format='JPEG', size=(300, 300), color=(239, 68, 68))
    upload_file2 = SimpleUploadedFile("new_avatar.jpg", jpg_bytes, content_type="image/jpeg")
    req = factory.post('/api/v1/auth/profile/avatar/', {'avatar': upload_file2}, format='multipart')
    force_authenticate(req, user=student)
    resp2 = avatar_view(req)
    assert resp2.status_code == 200, f"Expected 200, got {resp2.status_code}"
    student.refresh_from_db()
    new_avatar_path = student.avatar.path
    assert new_avatar_path != old_avatar_path, "Avatar path did not change upon replacement"
    if old_avatar_path:
        assert not os.path.exists(old_avatar_path), "Old avatar file was not cleaned up on replacement"
    print("[PASS] 5. Image replacement succeeded and old file cleaned up")

    # 6. Avatar deletion works
    req = factory.delete('/api/v1/auth/profile/avatar/')
    force_authenticate(req, user=student)
    resp_del = avatar_view(req)
    assert resp_del.status_code == 200, f"Expected 200, got {resp_del.status_code}"
    assert resp_del.data['data']['avatar_url'] is None
    student.refresh_from_db()
    assert not bool(student.avatar), "User avatar field was not cleared"
    assert student.avatar_url is None, "avatar_url was not cleared"
    assert not os.path.exists(new_avatar_path), "Avatar file was not removed from storage"
    print("[PASS] 6. Avatar deletion succeeded and storage cleaned up")

    # 7. Invalid file format rejected (.txt pretending to be image)
    fake_txt = SimpleUploadedFile("malicious.png", b"Hello world this is not an image", content_type="image/png")
    req = factory.post('/api/v1/auth/profile/avatar/', {'avatar': fake_txt}, format='multipart')
    force_authenticate(req, user=teacher)
    resp_bad = avatar_view(req)
    assert resp_bad.status_code == 400, f"Expected 400 for fake image, got {resp_bad.status_code}"
    print("[PASS] 7. Corrupted / non-image file rejected (400)")

    # 8. Oversized file rejected (> 5MB)
    big_file = SimpleUploadedFile("huge.jpg", b"0" * (6 * 1024 * 1024), content_type="image/jpeg")
    req = factory.post('/api/v1/auth/profile/avatar/', {'avatar': big_file}, format='multipart')
    force_authenticate(req, user=teacher)
    resp_big = avatar_view(req)
    assert resp_big.status_code == 400, f"Expected 400 for >5MB file, got {resp_big.status_code}"
    print("[PASS] 8. Oversized file (>5MB) rejected (400)")

    # 9. Student cannot modify another user's avatar via admin endpoint
    png_bytes = create_test_image(format='PNG', size=(150, 150))
    upload_file = SimpleUploadedFile("avatar.png", png_bytes, content_type="image/png")
    req = factory.post(f'/api/v1/auth/users/{teacher.id}/avatar/', {'avatar': upload_file}, format='multipart')
    force_authenticate(req, user=student)
    resp_sec = user_viewset(req, pk=str(teacher.id))
    assert resp_sec.status_code == 403, f"Expected 403 Forbidden, got {resp_sec.status_code}"
    print("[PASS] 9. Student cannot modify another user's avatar (403 Forbidden)")

    # 10. Parent cannot modify another user's avatar via admin endpoint
    req = factory.post(f'/api/v1/auth/users/{teacher.id}/avatar/', {'avatar': upload_file}, format='multipart')
    force_authenticate(req, user=parent)
    resp_sec2 = user_viewset(req, pk=str(teacher.id))
    assert resp_sec2.status_code == 403, f"Expected 403 Forbidden, got {resp_sec2.status_code}"
    print("[PASS] 10. Parent cannot modify another user's avatar (403 Forbidden)")

    # 11. Administrator CAN manage user's avatar via admin endpoint
    upload_file_adm = SimpleUploadedFile("adm_avatar.png", png_bytes, content_type="image/png")
    req = factory.post(f'/api/v1/auth/users/{teacher.id}/avatar/', {'avatar': upload_file_adm}, format='multipart')
    force_authenticate(req, user=admin)
    resp_adm = user_viewset(req, pk=str(teacher.id))
    assert resp_adm.status_code == 200, f"Expected 200, got {resp_adm.status_code}: {resp_adm.data}"
    teacher.refresh_from_db()
    assert bool(teacher.avatar), "Teacher avatar was not updated by admin"

    # Cleanup teacher avatar
    req = factory.delete(f'/api/v1/auth/users/{teacher.id}/avatar/')
    force_authenticate(req, user=admin)
    resp_adm_del = user_viewset(req, pk=str(teacher.id))
    assert resp_adm_del.status_code == 200, f"Expected 200, got {resp_adm_del.status_code}"
    print("[PASS] 11. Administrator successfully managed & removed user avatar via admin endpoint")

    print("\nALL 11 BACKEND SECURITY & AVATAR TESTS PASSED 100%!")

if __name__ == '__main__':
    run_tests()
