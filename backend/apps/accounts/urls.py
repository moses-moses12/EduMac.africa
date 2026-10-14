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

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('password/change/', ChangePasswordView.as_view(), name='password-change'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password-alias'),
    path('password/reset/', ResetPasswordView.as_view(), name='password-reset'),
    path('me/', CurrentUserView.as_view(), name='auth-me'),
    path('profile/', CurrentUserView.as_view(), name='auth-profile-alias'),
    path('profile/avatar/', AvatarView.as_view(), name='auth-profile-avatar'),
    path('avatar/', AvatarView.as_view(), name='auth-avatar-alias'),
    path('', include(router.urls)),
]
