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

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'phone_number',
            'address', 'avatar', 'avatar_url', 'is_active', 'is_verified',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

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

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone_number', 'address', 'password'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        username = validated_data.get('username')
        if not username:
            validated_data['username'] = validated_data.get('email')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

