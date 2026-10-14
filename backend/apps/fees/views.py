import time
import random
from decimal import Decimal
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum, Count

from apps.accounts.models import UserRole
from apps.students.models import Student
from core.permissions import IsAccountant
from core.utilities import log_audit_event
from .models import FeeStructure, FeeItem, Invoice, Payment, Receipt, InvoiceStatus
from .serializers import (
    FeeStructureSerializer,
    FeeItemSerializer,
    InvoiceSerializer,
    PaymentSerializer,
    ReceiptSerializer,
    BulkGenerateInvoicesSerializer,
)

class StudentMyFeesView(APIView):
    """
    Self-service endpoint deriving student identity from authenticated session,
    with flexible support for parents, students, and administration preview.
    STRICT ENFORCEMENT: Parents can only access their explicitly linked children.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = None
        student_id = request.query_params.get('student_id')
        linked_children = []

        if request.user.role == UserRole.STUDENT:
            student = Student.objects.filter(user=request.user).first()
        elif request.user.role == UserRole.PARENT:
            parent_profile = getattr(request.user, 'parent_profile', None)
            if not parent_profile:
                return Response({"error": "No parent profile associated with this account."}, status=status.HTTP_404_NOT_FOUND)
            children = parent_profile.children.all().select_related('user', 'current_class')
            linked_children = [
                {
                    "id": str(c.id),
                    "admission_number": c.admission_number,
                    "name": c.user.get_full_name(),
                    "class_name": c.current_class.name if c.current_class else "N/A"
                } for c in children
            ]
            if student_id:
                student = children.filter(id=student_id).first()
                if not student:
                    return Response({"error": "Child not found or not linked to your parent account."}, status=status.HTTP_404_NOT_FOUND)
            else:
                student = children.first()
        elif request.user.role in [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.HEADMASTER] or request.user.is_superuser:
            if student_id:
                student = Student.objects.filter(id=student_id).first() or Student.objects.filter(admission_number=student_id).first()
            if not student:
                student = Student.objects.first()
        else:
            return Response({"error": "This endpoint is restricted to authenticated students, guardians, and finance officers."}, status=status.HTTP_403_FORBIDDEN)

        if not student:
            return Response({"error": "No student profile associated with this account."}, status=status.HTTP_404_NOT_FOUND)

        invoices = Invoice.objects.filter(student=student).select_related(
            'fee_structure__term', 'fee_structure__academic_year'
        ).prefetch_related('payments').order_by('-created_at')

        payments = Payment.objects.filter(invoice__student=student).select_related(
            'receipt', 'received_by', 'invoice'
        ).order_by('-payment_date', '-created_at')

        total_billed = invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')
        total_paid = invoices.aggregate(Sum('paid_amount'))['paid_amount__sum'] or Decimal('0.00')
        total_balance = invoices.aggregate(Sum('balance'))['balance__sum'] or Decimal('0.00')

        return Response({
            "student_id": str(student.id),
            "student_admission": student.admission_number,
            "student_name": student.user.get_full_name(),
            "class_name": student.current_class.name if student.current_class else "N/A",
            "linked_children": linked_children,
            "summary": {
                "total_billed": round(float(total_billed), 2),
                "total_paid": round(float(total_paid), 2),
                "outstanding_balance": round(float(total_balance), 2),
            },
            "invoices": InvoiceSerializer(invoices, many=True).data,
            "payments": PaymentSerializer(payments, many=True).data
        })


class FeeBasePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return IsAccountant().has_permission(request, view)

class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.all().prefetch_related('items', 'class_obj', 'term', 'academic_year')
    serializer_class = FeeStructureSerializer
    permission_classes = [FeeBasePermission]
    filterset_fields = ['academic_year', 'term', 'class_obj']

class FeeItemViewSet(viewsets.ModelViewSet):
    queryset = FeeItem.objects.all()
    serializer_class = FeeItemSerializer
    permission_classes = [FeeBasePermission]
    filterset_fields = ['fee_structure', 'is_mandatory']

class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'student', 'fee_structure']
    search_fields = ['invoice_number', 'student__admission_number', 'student__user__first_name', 'student__user__last_name']

    def get_queryset(self):
        user = self.request.user
        qs = Invoice.objects.all().select_related(
            'student__user',
            'student__current_class',
            'fee_structure__term',
            'fee_structure__academic_year'
        ).prefetch_related('payments')

        if user.role == UserRole.STUDENT:
            return qs.filter(student__user=user)
        elif user.role == UserRole.PARENT:
            return qs.filter(student__parent__user=user)
        return qs

    @action(detail=False, methods=['post'], permission_classes=[IsAccountant])
    def generate_bulk(self, request):
        """Batch-generate billing invoices for all active students enrolled in a class fee structure."""
        serializer = BulkGenerateInvoicesSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        fee_structure_id = serializer.validated_data['fee_structure_id']
        fee_structure = FeeStructure.objects.filter(id=fee_structure_id).first()
        if not fee_structure:
            return Response({"error": "Fee structure not found."}, status=status.HTTP_404_NOT_FOUND)

        students = Student.objects.filter(current_class=fee_structure.class_obj, is_active=True)
        created_count = 0

        with transaction.atomic():
            for student in students:
                invoice_num = f"INV-{student.admission_number}-{int(time.time())}-{random.randint(100, 999)}"
                _, created = Invoice.objects.get_or_create(
                    student=student,
                    fee_structure=fee_structure,
                    defaults={
                        'invoice_number': invoice_num,
                        'total_amount': fee_structure.total_amount,
                        'paid_amount': Decimal('0.00'),
                        'balance': fee_structure.total_amount,
                        'status': InvoiceStatus.UNPAID,
                        'due_date': fee_structure.due_date,
                    }
                )
                if created:
                    created_count += 1

        log_audit_event(
            user=request.user,
            action="CREATE",
            model_name="Invoice",
            object_id=str(fee_structure.id),
            changes={"generated_invoices": created_count, "fee_structure": str(fee_structure.id)},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({
            "success": True,
            "message": f"Successfully generated {created_count} student invoices.",
            "fee_structure": fee_structure.class_obj.name
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def financial_summary(self, request):
        """High-level financial KPIs for Bursar and Headmaster dashboards."""
        qs = self.get_queryset()
        total_billed = qs.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')
        total_collected = qs.aggregate(Sum('paid_amount'))['paid_amount__sum'] or Decimal('0.00')
        total_outstanding = qs.aggregate(Sum('balance'))['balance__sum'] or Decimal('0.00')

        collection_rate = 0.0
        if total_billed > 0:
            collection_rate = round(float((total_collected / total_billed) * 100), 1)

        paid_count = qs.filter(status=InvoiceStatus.PAID).count()
        partial_count = qs.filter(status=InvoiceStatus.PARTIAL).count()
        unpaid_count = qs.filter(status=InvoiceStatus.UNPAID).count()

        return Response({
            "total_billed": float(total_billed),
            "total_collected": float(total_collected),
            "total_outstanding": float(total_outstanding),
            "collection_rate": collection_rate,
            "counts": {
                "paid": paid_count,
                "partial": partial_count,
                "unpaid": unpaid_count,
                "total": qs.count()
            }
        })

class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['payment_method', 'invoice']
    search_fields = ['payment_number', 'transaction_reference', 'invoice__invoice_number']

    def get_queryset(self):
        user = self.request.user
        qs = Payment.objects.all().select_related('invoice__student__user', 'received_by', 'receipt')
        student_id = self.request.query_params.get('student_id')
        if user.role == UserRole.STUDENT:
            return qs.filter(invoice__student__user=user)
        elif user.role == UserRole.PARENT:
            qs = qs.filter(invoice__student__parent__user=user)
            if student_id:
                qs = qs.filter(invoice__student_id=student_id)
            return qs
        elif student_id:
            qs = qs.filter(invoice__student_id=student_id)
        return qs

    def perform_create(self, serializer):
        pay_number = f"PAY-{int(time.time())}-{random.randint(1000, 9999)}"
        payment = serializer.save(
            payment_number=pay_number,
            received_by=self.request.user
        )
        log_audit_event(
            user=self.request.user,
            action="PAYMENT",
            model_name="Payment",
            object_id=str(payment.id),
            changes={"amount": str(payment.amount), "invoice": payment.invoice.invoice_number},
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

class ReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['receipt_number', 'payment__payment_number']

    def get_queryset(self):
        user = self.request.user
        qs = Receipt.objects.all().select_related('payment__invoice__student__user')
        if user.role == UserRole.STUDENT:
            return qs.filter(payment__invoice__student__user=user)
        elif user.role == UserRole.PARENT:
            return qs.filter(payment__invoice__student__parent__user=user)
        return qs
