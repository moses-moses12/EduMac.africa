from datetime import date
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.models import UserRole
from core.permissions import IsLibrarian
from .models import BookCategory, Book, BookLoan, LoanStatus
from .serializers import BookCategorySerializer, BookSerializer, BookLoanSerializer

class LibraryBasePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return IsLibrarian().has_permission(request, view)

class BookCategoryViewSet(viewsets.ModelViewSet):
    queryset = BookCategory.objects.all().prefetch_related('books')
    serializer_class = BookCategorySerializer
    permission_classes = [LibraryBasePermission]
    search_fields = ['name']

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().select_related('category')
    serializer_class = BookSerializer
    permission_classes = [LibraryBasePermission]
    filterset_fields = ['category']
    search_fields = ['isbn', 'title', 'author', 'shelf_location']

class BookLoanViewSet(viewsets.ModelViewSet):
    serializer_class = BookLoanSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'book', 'user']
    search_fields = ['book__title', 'book__isbn', 'user__first_name', 'user__last_name', 'user__email']

    def get_queryset(self):
        user = self.request.user
        qs = BookLoan.objects.all().select_related('book', 'user')
        if user.role in [UserRole.STUDENT, UserRole.PARENT]:
            return qs.filter(user=user)
        return qs

    @action(detail=True, methods=['post'], permission_classes=[IsLibrarian])
    def return_book(self, request, pk=None):
        """Processes book check-in and updates catalogue inventory count."""
        loan = self.get_object()
        if loan.status == LoanStatus.RETURNED:
            return Response({"error": "This loan has already been recorded as returned."}, status=status.HTTP_400_BAD_REQUEST)

        loan.return_date = date.today()
        loan.status = LoanStatus.RETURNED
        loan.save()

        return Response(BookLoanSerializer(loan).data)
