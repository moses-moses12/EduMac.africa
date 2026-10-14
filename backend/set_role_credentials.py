import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User, UserRole
from apps.accounts.serializers import LoginSerializer

roles_data = [
    ('moses', 'moses@school.edu', 'Moses', 'Administrator', UserRole.ADMIN, True, True, 'moses'),
    ('admin', 'admin@school.edu', 'Sarah', 'Connor', UserRole.ADMIN, True, True, 'Password123!'),
    ('headmaster', 'headmaster@school.edu', 'Arthur', 'Pendelton', UserRole.HEADMASTER, True, False, 'Password123!'),
    ('academic', 'academic@school.edu', 'Marcus', 'Vance', UserRole.ACADEMIC, False, False, 'Password123!'),
    ('teacher', 'teacher@school.edu', 'Elizabeth', 'Bennett', UserRole.TEACHER, False, False, 'Password123!'),
    ('student', 'student@school.edu', 'Alexander', 'Pierce', UserRole.STUDENT, False, False, 'Password123!'),
    ('parent', 'parent@school.edu', 'Jonathan', 'Pierce', UserRole.PARENT, False, False, 'Password123!'),
    ('accountant', 'accountant@school.edu', 'David', 'Sterling', UserRole.ACCOUNTANT, False, False, 'Password123!'),
    ('librarian', 'librarian@school.edu', 'Clara', 'Oswald', UserRole.LIBRARIAN, False, False, 'Password123!'),
    ('exam', 'exam@school.edu', 'Gregory', 'House', UserRole.EXAM_OFFICER, False, False, 'Password123!'),
    ('staff', 'staff@school.edu', 'Beatrice', 'Montgomery', UserRole.STAFF, False, False, 'Password123!'),
]

print('=== CONFIGURING CREDENTIALS FOR ALL ROLES ===')
for uname, email, fn, ln, role, is_staff, is_superuser, pwd in roles_data:
    user = User.objects.filter(email=email).first()
    if not user:
        user = User.objects.filter(username=uname).first()
    if not user:
        user = User.objects.create(
            username=uname,
            email=email,
            first_name=fn,
            last_name=ln,
            role=role,
            is_active=True,
            is_verified=True,
            is_staff=is_staff,
            is_superuser=is_superuser,
        )
    else:
        user.username = uname
        user.email = email
        user.first_name = fn
        user.last_name = ln
        user.role = role
        user.is_active = True
        user.is_verified = True
        user.is_staff = is_staff
        user.is_superuser = is_superuser

    user.set_password(pwd)
    user.save()
    print(f'Configured [{role}]: Username={user.username:<12} Email={user.email:<22} Active={user.is_active}')

print('\n=== TESTING AUTHENTICATION FOR ALL ROLES ===')
success_count = 0
for uname, email, fn, ln, role, _, _, pwd in roles_data:
    # Test 1: Login by username
    s1 = LoginSerializer(data={'username': uname, 'password': pwd})
    valid1 = s1.is_valid()
    
    # Test 2: Login by email
    s2 = LoginSerializer(data={'email': email, 'password': pwd})
    valid2 = s2.is_valid()
    
    status_str = 'PASS' if (valid1 and valid2) else 'FAIL'
    if valid1 and valid2:
        success_count += 1
        print(f'[{status_str}] Role: {role:<12} | Username Login (\"{uname}\"): OK | Email Login (\"{email}\"): OK')
    else:
        print(f'[{status_str}] Role: {role:<12} | Err1: {s1.errors} | Err2: {s2.errors}')

print(f'\nTotal Roles Verified: {success_count}/{len(roles_data)}')
