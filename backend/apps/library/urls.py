from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookCategoryViewSet, BookViewSet, BookLoanViewSet

router = DefaultRouter()
router.register(r'categories', BookCategoryViewSet, basename='book-category')
router.register(r'books', BookViewSet, basename='book')
router.register(r'loans', BookLoanViewSet, basename='book-loan')
router.register(r'', BookViewSet, basename='library-root')

urlpatterns = [
    path('', include(router.urls)),
]
