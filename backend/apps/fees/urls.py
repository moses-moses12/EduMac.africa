from core.routers import OptionalSlashRouter
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FeeStructureViewSet,
    FeeItemViewSet,
    InvoiceViewSet,
    PaymentViewSet,
    ReceiptViewSet,
    StudentMyFeesView
)

router = OptionalSlashRouter()
router.register(r'structures', FeeStructureViewSet, basename='fee-structure')
router.register(r'items', FeeItemViewSet, basename='fee-item')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'receipts', ReceiptViewSet, basename='receipt')
router.register(r'', FeeStructureViewSet, basename='fee-root')

urlpatterns = [
    path('me/', StudentMyFeesView.as_view(), name='fees-me'),
    path('', include(router.urls)),
]
