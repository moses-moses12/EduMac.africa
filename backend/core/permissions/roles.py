from rest_framework.permissions import BasePermission
from apps.accounts.models import UserRole

class IsAdmin(BasePermission):
    """Allows access only to System Administrators."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role == UserRole.ADMIN or request.user.is_superuser
        ))

class IsHeadmaster(BasePermission):
    """Allows access only to Headmasters or Admins."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role in [UserRole.HEADMASTER, UserRole.ADMIN] or request.user.is_superuser
        ))

class IsAcademicOfficer(BasePermission):
    """Allows access to Academic Officers, Headmasters, or Admins."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role in [UserRole.ACADEMIC, UserRole.HEADMASTER, UserRole.ADMIN] or request.user.is_superuser
        ))

class IsTeacher(BasePermission):
    """Allows access to Teachers, Headmasters, or Admins."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role in [UserRole.TEACHER, UserRole.HEADMASTER, UserRole.ADMIN] or request.user.is_superuser
        ))

class IsStudent(BasePermission):
    """Allows access to Students."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.STUDENT)

class IsParent(BasePermission):
    """Allows access to Parents/Guardians."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.PARENT)

class IsAccountant(BasePermission):
    """Allows access to Accountants, Headmasters, or Admins."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role in [UserRole.ACCOUNTANT, UserRole.HEADMASTER, UserRole.ADMIN] or request.user.is_superuser
        ))

class IsLibrarian(BasePermission):
    """Allows access to Librarians, Headmasters, or Admins."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role in [UserRole.LIBRARIAN, UserRole.HEADMASTER, UserRole.ADMIN] or request.user.is_superuser
        ))

class IsExamOfficer(BasePermission):
    """Allows access to Examination Officers, Headmasters, or Admins."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role in [UserRole.EXAM_OFFICER, UserRole.HEADMASTER, UserRole.ADMIN] or request.user.is_superuser
        ))

class IsSchoolStaff(BasePermission):
    """Allows access to School Staff, Headmaster, or Admin."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role in [UserRole.STAFF, UserRole.HEADMASTER, UserRole.ADMIN] or request.user.is_superuser
        ))

class HasAnyRole(BasePermission):
    """Custom permission to check against an allowed list of roles specified on the view."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser or request.user.role == UserRole.ADMIN:
            return True
        allowed_roles = getattr(view, 'allowed_roles', [])
        return request.user.role in allowed_roles
