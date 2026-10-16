from core.routers import OptionalSlashRouter
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView,
    LogoutView,
    CurrentUserView,
    ChangePasswordView,
    ResetPasswordView,
    AvatarView,
    UserViewSet,
)

router = OptionalSlashRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('login', LoginView.as_view(), name='auth-login-no-slash'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('refresh', TokenRefreshView.as_view(), name='token-refresh-no-slash'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('logout', LogoutView.as_view(), name='auth-logout-no-slash'),
    path('password/change/', ChangePasswordView.as_view(), name='password-change'),
    path('password/change', ChangePasswordView.as_view(), name='password-change-no-slash'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password-alias'),
    path('change-password', ChangePasswordView.as_view(), name='auth-change-password-alias-no-slash'),
    path('password/reset/', ResetPasswordView.as_view(), name='password-reset'),
    path('password/reset', ResetPasswordView.as_view(), name='password-reset-no-slash'),
    path('me/', CurrentUserView.as_view(), name='auth-me'),
    path('me', CurrentUserView.as_view(), name='auth-me-no-slash'),
    path('profile/', CurrentUserView.as_view(), name='auth-profile-alias'),
    path('profile', CurrentUserView.as_view(), name='auth-profile-alias-no-slash'),
    path('profile/avatar/', AvatarView.as_view(), name='auth-profile-avatar'),
    path('profile/avatar', AvatarView.as_view(), name='auth-profile-avatar-no-slash'),
    path('avatar/', AvatarView.as_view(), name='auth-avatar-alias'),
    path('avatar', AvatarView.as_view(), name='auth-avatar-alias-no-slash'),
    path('', include(router.urls)),
]
