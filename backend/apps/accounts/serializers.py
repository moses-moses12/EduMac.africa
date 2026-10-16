import base64
from django.core.files.base import ContentFile
from rest_framework import serializers
from django.db import models
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, UserRole

class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    avatar_url = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()
    specialization = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    designation = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'phone_number',
            'address', 'avatar', 'avatar_url', 'is_active', 'is_verified',
            'employee_id', 'specialization', 'department', 'designation',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_employee_id(self, obj):
        try:
            if hasattr(obj, 'teacher_profile') and obj.teacher_profile:
                return obj.teacher_profile.employee_id
            if hasattr(obj, 'staff_profile') and obj.staff_profile:
                return obj.staff_profile.employee_id
        except Exception:
            pass
        return None

    def get_specialization(self, obj):
        try:
            if hasattr(obj, 'teacher_profile') and obj.teacher_profile:
                return obj.teacher_profile.specialization
        except Exception:
            pass
        return None

    def get_department(self, obj):
        try:
            if hasattr(obj, 'staff_profile') and obj.staff_profile:
                return obj.staff_profile.department
        except Exception:
            pass
        return None

    def get_designation(self, obj):
        try:
            if hasattr(obj, 'staff_profile') and obj.staff_profile:
                return obj.staff_profile.designation
        except Exception:
            pass
        return None

    def get_avatar_url(self, obj):
        if obj.avatar:
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.avatar.url)
                return obj.avatar.url
            except Exception:
                pass
        return obj.avatar_url

class AnyImageField(serializers.Field):
    def to_internal_value(self, data):
        return data

    def to_representation(self, value):
        return str(value)

class AvatarUploadSerializer(serializers.Serializer):
    avatar = AnyImageField(required=False)
    image = AnyImageField(required=False)
    file = AnyImageField(required=False)

    def validate(self, attrs):
        raw_input = attrs.get('avatar') or attrs.get('image') or attrs.get('file')
        if not raw_input and hasattr(self, 'initial_data') and isinstance(self.initial_data, dict):
            raw_input = self.initial_data.get('avatar') or self.initial_data.get('image') or self.initial_data.get('file')

        if not raw_input:
            raise serializers.ValidationError("An image file must be provided under 'avatar', 'image', or 'file'.")

        uploaded_file = raw_input

        # Handle Base64 string payload
        if isinstance(raw_input, str):
            try:
                if ';base64,' in raw_input:
                    header, imgstr = raw_input.split(';base64,')
                    ext = header.split('/')[-1] if '/' in header else 'png'
                else:
                    imgstr = raw_input
                    ext = 'png'
                decoded_data = base64.b64decode(imgstr)
                uploaded_file = ContentFile(decoded_data, name=f"avatar.{ext}")
            except Exception:
                raise serializers.ValidationError("Invalid base64 image data.")

        # 1. File size limit: 5MB
        max_size = 5 * 1024 * 1024
        file_size = getattr(uploaded_file, 'size', None)
        if file_size is None and hasattr(uploaded_file, '__len__'):
            file_size = len(uploaded_file)
        if file_size and file_size > max_size:
            raise serializers.ValidationError("Image file size exceeds the maximum allowed limit of 5MB.")

        # 2. Content validation with Pillow
        try:
            from PIL import Image
            img = Image.open(uploaded_file)
            img.verify()
        except Exception:
            raise serializers.ValidationError("Uploaded file is corrupted or not a valid image.")

        # 3. Format validation
        allowed_formats = {'JPEG', 'JPG', 'PNG', 'WEBP', 'GIF'}
        uploaded_file.seek(0)
        try:
            img = Image.open(uploaded_file)
            fmt = (img.format or '').upper()
            if fmt not in allowed_formats:
                raise serializers.ValidationError(f"Unsupported image format '{fmt}'. Supported: JPEG, PNG, WEBP, GIF.")

            # 4. Decompression bomb & dimension limits
            width, height = img.size
            if width > 4096 or height > 4096 or (width * height > 16_000_000):
                raise serializers.ValidationError("Image dimensions exceed 4096x4096px limit.")
        except serializers.ValidationError:
            raise
        except Exception:
            raise serializers.ValidationError("Unable to inspect image properties.")

        uploaded_file.seek(0)
        attrs['validated_file'] = uploaded_file
        return attrs

class LoginSerializer(serializers.Serializer):
    email = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identifier = (attrs.get('email') or attrs.get('username') or '').strip()
        password = attrs.get('password')

        if not identifier or not password:
            raise serializers.ValidationError("Must include username or email, and password.")

        # Attempt match by email or username (case-insensitive)
        matched_user = User.objects.filter(
            models.Q(email__iexact=identifier) | models.Q(username__iexact=identifier)
        ).first()

        user = None
        if matched_user:
            if matched_user.check_password(password):
                user = matched_user
        else:
            # Timing attack mitigation: do a dummy hash check so response times match
            dummy_user = User()
            dummy_user.set_password(password)

        if not user:
            # Fallback to standard Django backend authentication
            user = authenticate(username=identifier, password=password)

        if not user:
            raise serializers.ValidationError("Invalid username/email or password.")

        if not user.is_active:
            raise serializers.ValidationError("User account is inactive. Please contact your administrator.")

        refresh = RefreshToken.for_user(user)
        # Add custom claims to the JWT payload
        refresh['role'] = user.role
        refresh['email'] = user.email
        refresh['username'] = user.username
        refresh['full_name'] = f"{user.first_name} {user.last_name}".strip()

        return {
            'user': user,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password does not match.")
        return value

class AdminSetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(required=True, write_only=True, min_length=8)

class ResetPasswordRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class CreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    username = serializers.CharField(required=False, allow_blank=True)
    employee_id = serializers.CharField(required=False, allow_blank=True, write_only=True)
    specialization = serializers.CharField(required=False, allow_blank=True, write_only=True)
    qualification = serializers.CharField(required=False, allow_blank=True, write_only=True)
    department = serializers.CharField(required=False, allow_blank=True, write_only=True)
    designation = serializers.CharField(required=False, allow_blank=True, write_only=True)
    gender = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone_number', 'address', 'password',
            'employee_id', 'specialization', 'qualification',
            'department', 'designation', 'gender', 'is_active'
        ]

    def create(self, validated_data):
        employee_id = validated_data.pop('employee_id', None)
        specialization = validated_data.pop('specialization', '')
        qualification = validated_data.pop('qualification', '')
        department = validated_data.pop('department', '')
        designation = validated_data.pop('designation', '')
        _gender = validated_data.pop('gender', None)

        password = validated_data.pop('password')
        raw_username = (validated_data.get('username') or '').strip()
        email = (validated_data.get('email') or '').strip().lower()
        validated_data['email'] = email

        if not raw_username:
            first = validated_data.get('first_name', '').strip().lower().replace(' ', '')
            last = validated_data.get('last_name', '').strip().lower().replace(' ', '')
            base_user = f"{first[:1]}{last}" if (first and last) else (email.split('@')[0] if email else 'user')
            candidate = base_user
            idx = 1
            while User.objects.filter(username__iexact=candidate).exists():
                candidate = f"{base_user}{idx}"
                idx += 1
            validated_data['username'] = candidate
        else:
            validated_data['username'] = raw_username

        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()

        # If role is TEACHER, create or update Teacher profile automatically
        if user.role == UserRole.TEACHER:
            try:
                from apps.staff.models import Teacher
                emp_id = (employee_id or '').strip()
                if not emp_id:
                    emp_id = f"TSC-{user.id.hex[:6].upper()}"
                cand_emp = emp_id
                counter = 1
                while Teacher.objects.filter(employee_id=cand_emp).exists():
                    cand_emp = f"{emp_id}-{counter}"
                    counter += 1
                Teacher.objects.get_or_create(
                    user=user,
                    defaults={
                        'employee_id': cand_emp,
                        'specialization': specialization or 'General Education',
                        'qualification': qualification or 'Degree in Education',
                        'is_active': user.is_active,
                    }
                )
            except Exception:
                pass

        # If role is STAFF, create or update Staff profile automatically
        elif user.role == UserRole.STAFF:
            try:
                from apps.staff.models import Staff
                emp_id = (employee_id or '').strip()
                if not emp_id:
                    emp_id = f"STF-{user.id.hex[:6].upper()}"
                cand_emp = emp_id
                counter = 1
                while Staff.objects.filter(employee_id=cand_emp).exists():
                    cand_emp = f"{emp_id}-{counter}"
                    counter += 1
                Staff.objects.get_or_create(
                    user=user,
                    defaults={
                        'employee_id': cand_emp,
                        'department': department or 'Administration',
                        'designation': designation or 'Support Staff',
                        'is_active': user.is_active,
                    }
                )
            except Exception:
                pass

        return user

