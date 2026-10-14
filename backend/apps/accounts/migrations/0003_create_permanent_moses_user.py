# Generated for permanent Moses admin user credentials

from django.db import migrations
from django.contrib.auth.hashers import make_password


def create_moses_admin(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    user = User.objects.filter(username='moses').first()
    if not user:
        user = User.objects.filter(email='moses@school.edu').first()

    if not user:
        User.objects.create(
            username='moses',
            email='moses@school.edu',
            first_name='Moses',
            last_name='Administrator',
            role='ADMIN',
            is_staff=True,
            is_superuser=True,
            is_active=True,
            is_verified=True,
            password=make_password('moses'),
        )
    else:
        user.username = 'moses'
        user.email = 'moses@school.edu'
        user.first_name = 'Moses'
        user.last_name = 'Administrator'
        user.role = 'ADMIN'
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.is_verified = True
        user.password = make_password('moses')
        user.save()


def reverse_func(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_avatar'),
    ]

    operations = [
        migrations.RunPython(create_moses_admin, reverse_func),
    ]
