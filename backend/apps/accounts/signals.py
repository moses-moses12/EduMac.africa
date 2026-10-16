import logging
from django.db.models.signals import post_migrate
from django.dispatch import receiver

logger = logging.getLogger('apps.accounts')

DEFAULT_ACCOUNTS = [
    ('moses', 'moses@school.edu', 'Moses', 'Administrator', 'ADMIN', True, True, 'moses'),
    ('admin', 'admin@school.edu', 'Sarah', 'Connor', 'ADMIN', True, True, 'Password123!'),
    ('headmaster', 'headmaster@school.edu', 'Arthur', 'Pendelton', 'HEADMASTER', True, False, 'Password123!'),
    ('academic', 'academic@school.edu', 'Marcus', 'Vance', 'ACADEMIC', False, False, 'Password123!'),
    ('teacher', 'teacher@school.edu', 'Elizabeth', 'Bennett', 'TEACHER', False, False, 'Password123!'),
    ('student', 'student@school.edu', 'Alexander', 'Pierce', 'STUDENT', False, False, 'Password123!'),
    ('parent', 'parent@school.edu', 'Jonathan', 'Pierce', 'PARENT', False, False, 'Password123!'),
    ('accountant', 'accountant@school.edu', 'David', 'Sterling', 'ACCOUNTANT', False, False, 'Password123!'),
    ('librarian', 'librarian@school.edu', 'Clara', 'Oswald', 'LIBRARIAN', False, False, 'Password123!'),
    ('exam', 'exam@school.edu', 'Gregory', 'House', 'EXAM_OFFICER', False, False, 'Password123!'),
    ('staff', 'staff@school.edu', 'Beatrice', 'Montgomery', 'STAFF', False, False, 'Password123!'),
]

@receiver(post_migrate)
def ensure_default_accounts_exist(sender, **kwargs):
    """
    Guarantees permanent database persistence for essential user accounts & roles
    after every database migration.
    """
    if sender.name != 'apps.accounts':
        return

    from apps.accounts.models import User, UserRole

    for uname, email, fn, ln, role_str, is_staff, is_superuser, pwd in DEFAULT_ACCOUNTS:
        try:
            role = getattr(UserRole, role_str, UserRole.ADMIN)
            user = User.objects.filter(email=email).first() or User.objects.filter(username=uname).first()
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
                user.set_password(pwd)
                user.save()
                logger.info(f"Permanent account created: {uname} ({email})")
            else:
                # Ensure account is active and verified
                user.is_active = True
                user.is_verified = True
                user.save(update_fields=['is_active', 'is_verified'])
        except Exception as e:
            logger.warning(f"Failed to ensure account {uname}: {e}")
