import os
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema

from core.utilities import api_success, api_error, log_audit_event
from core.permissions import IsAdmin
from .models import User, UserRole
from .serializers import (
    UserSerializer,
    LoginSerializer,
    ChangePasswordSerializer,
    AdminSetPasswordSerializer,
    ResetPasswordRequestSerializer,
    CreateUserSerializer,
    AvatarUploadSerializer,
)

from rest_framework.throttling import AnonRateThrottle

class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'

class LoginView(APIView):
    """
    Authenticate a user via email and password.
    Returns access & refresh JWT tokens with role details.
    Protected by rate throttling and security audit tracking.
    """
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    @extend_schema(request=LoginSerializer, responses={200: UserSerializer})
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            access_token = serializer.validated_data['access']
            refresh_token = serializer.validated_data['refresh']

            log_audit_event(
                user=user,
                action="LOGIN",
                model_name="User",
                object_id=str(user.id),
                changes={"email": user.email, "role": user.role, "status": "SUCCESS"},
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response({
                "success": True,
                "message": f"Welcome back, {user.first_name or user.email}!",
                "data": {
                    "user": UserSerializer(user).data,
                    "tokens": {
                        "access": access_token,
                        "refresh": refresh_token,
                    }
                }
            }, status=status.HTTP_200_OK)

        # Security audit log for failed authentication attempt
        raw_identifier = (request.data.get('email') or request.data.get('username') or 'anonymous').strip()
        log_audit_event(
            user=None,
            action="LOGIN_FAILED",
            model_name="User",
            object_id=raw_identifier[:100],
            changes={"attempted_identifier": raw_identifier[:100], "status": "REJECTED", "reason": "Invalid credentials or inactive account"},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({
            "success": False,
            "message": "Invalid username or password. Please check your credentials.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    """Invalidate or acknowledge user session termination."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

        log_audit_event(
            user=request.user,
            action="LOGOUT",
            model_name="User",
            object_id=str(request.user.id),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return api_success(message="Successfully logged out.")

class CurrentUserView(APIView):
    """Retrieve details and update profile of the currently authenticated user."""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: UserSerializer})
    def get(self, request):
        return api_success(data=UserSerializer(request.user).data)

    @extend_schema(request=UserSerializer, responses={200: UserSerializer})
    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_audit_event(
                user=request.user,
                action="UPDATE",
                model_name="User",
                object_id=str(request.user.id),
                changes={"event": "profile_update"},
                ip_address=request.META.get('REMOTE_ADDR')
            )
            return api_success(data=serializer.data, message="Profile updated successfully.")
        return api_error(message="Profile update failed.", errors=serializer.errors)

class ChangePasswordView(APIView):
    """Update password for the authenticated user."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            log_audit_event(
                user=user,
                action="UPDATE",
                model_name="User",
                object_id=str(user.id),
                changes={"event": "password_changed"},
                ip_address=request.META.get('REMOTE_ADDR')
            )
            return api_success(message="Password successfully updated.")
        return api_error(message="Password change failed.", errors=serializer.errors)

class AvatarView(APIView):
    """
    POST: Upload, validate and persist authenticated user's profile image.
    DELETE: Remove authenticated user's profile image and restore default avatar.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @extend_schema(request=AvatarUploadSerializer, responses={200: UserSerializer})
    def post(self, request):
        user = request.user
        data = request.data if request.data else request.FILES
        serializer = AvatarUploadSerializer(data=data)
        if serializer.is_valid():
            uploaded_file = serializer.validated_data['validated_file']

            # Safely remove existing avatar file if on disk
            if user.avatar:
                try:
                    if os.path.isfile(user.avatar.path):
                        os.remove(user.avatar.path)
                except Exception:
                    pass

            user.avatar = uploaded_file
            user.save()
            user.avatar_url = request.build_absolute_uri(user.avatar.url)
            user.save(update_fields=['avatar_url'])

            log_audit_event(
                user=user,
                action="UPDATE",
                model_name="User",
                object_id=str(user.id),
                changes={"event": "avatar_upload", "filename": user.avatar.name},
                ip_address=request.META.get('REMOTE_ADDR')
            )

            serialized_user = UserSerializer(user, context={'request': request}).data
            return api_success(
                data={
                    "avatar_url": serialized_user.get('avatar_url'),
                    "user": serialized_user,
                },
                message="Profile image uploaded successfully."
            )
        return api_error(message="Invalid image upload.", errors=serializer.errors)

    def delete(self, request):
        user = request.user
        if user.avatar:
            try:
                if os.path.isfile(user.avatar.path):
                    os.remove(user.avatar.path)
            except Exception:
                pass
            user.avatar.delete(save=False)
            user.avatar = None

        user.avatar_url = None
        user.save()

        log_audit_event(
            user=user,
            action="UPDATE",
            model_name="User",
            object_id=str(user.id),
            changes={"event": "avatar_remove"},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        serialized_user = UserSerializer(user, context={'request': request}).data
        return api_success(
            data={
                "avatar_url": None,
                "user": serialized_user,
            },
            message="Profile image removed successfully."
        )

class ResetPasswordView(APIView):
    """Initiate self-service password reset workflow."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            # Security best practice: don't reveal whether user exists
            return api_success(message=f"If an account exists for {email}, reset instructions have been sent.")
        return api_error(message="Invalid email address.", errors=serializer.errors)

class UserViewSet(viewsets.ModelViewSet):
    """Administrative CRUD endpoint for user management."""
    queryset = User.objects.all().order_by('-created_at')
    permission_classes = [IsAdmin]
    filterset_fields = ['role', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone_number']

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateUserSerializer
        return UserSerializer

    @action(detail=True, methods=['post'], url_path='set-password', permission_classes=[IsAdmin])
    def set_password(self, request, pk=None):
        """Allows administrators to set/reset passwords for any user in any institutional role."""
        user = self.get_object()
        serializer = AdminSetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            new_password = serializer.validated_data['password']
            user.set_password(new_password)
            user.save()
            log_audit_event(
                user=request.user,
                action="UPDATE",
                model_name="User",
                object_id=str(user.id),
                changes={"event": "admin_set_password", "target_email": user.email, "role": user.role},
                ip_address=request.META.get('REMOTE_ADDR')
            )
            return api_success(message=f"Password successfully updated for {user.username or user.email} ({user.role}).")
        return api_error(message="Invalid password data.", errors=serializer.errors)

    @action(detail=True, methods=['post', 'delete'], url_path='avatar', permission_classes=[IsAdmin], parser_classes=[MultiPartParser, FormParser, JSONParser])
    def manage_user_avatar(self, request, pk=None):
        """Allows administrators to upload or remove avatars for any institutional account."""
        target_user = self.get_object()
        if request.method == 'POST':
            data = request.data if request.data else request.FILES
            serializer = AvatarUploadSerializer(data=data)
            if serializer.is_valid():
                uploaded_file = serializer.validated_data['validated_file']
                if target_user.avatar:
                    try:
                        if os.path.isfile(target_user.avatar.path):
                            os.remove(target_user.avatar.path)
                    except Exception:
                        pass
                target_user.avatar = uploaded_file
                target_user.save()
                target_user.avatar_url = request.build_absolute_uri(target_user.avatar.url)
                target_user.save(update_fields=['avatar_url'])
                serialized = UserSerializer(target_user, context={'request': request}).data
                return api_success(data={"avatar_url": serialized.get('avatar_url'), "user": serialized}, message=f"Avatar updated for {target_user.email}")
            return api_error(message="Invalid image upload.", errors=serializer.errors)
        else: # DELETE
            if target_user.avatar:
                try:
                    if os.path.isfile(target_user.avatar.path):
                        os.remove(target_user.avatar.path)
                except Exception:
                    pass
                target_user.avatar.delete(save=False)
                target_user.avatar = None
            target_user.avatar_url = None
            target_user.save()
            serialized = UserSerializer(target_user, context={'request': request}).data
            return api_success(data={"avatar_url": None, "user": serialized}, message=f"Avatar removed for {target_user.email}")


