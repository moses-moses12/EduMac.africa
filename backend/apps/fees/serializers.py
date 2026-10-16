import time
import random
from decimal import Decimal
from django.utils import timezone
from rest_framework import serializers
from .models import FeeStructure, FeeItem, Invoice, Payment, Receipt, InvoiceStatus

class FeeItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeItem
        fields = ['id', 'fee_structure', 'name', 'amount', 'is_mandatory']

class FeeStructureSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    items = FeeItemSerializer(many=True, read_only=True)

    class Meta:
        model = FeeStructure
        fields = [
            'id', 'academic_year', 'academic_year_name',
            'term', 'term_name', 'class_obj', 'class_name',
            'total_amount', 'due_date', 'items'
        ]

class ReceiptSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(source='payment.amount', max_digits=12, decimal_places=2, read_only=True)
    payment_method = serializers.CharField(source='payment.get_payment_method_display', read_only=True)

    student_name = serializers.CharField(source='payment.invoice.student.user.get_full_name', read_only=True)
    admission_number = serializers.CharField(source='payment.invoice.student.admission_number', read_only=True)
    class_name = serializers.CharField(source='payment.invoice.student.current_class.name', read_only=True)

    class Meta:
        model = Receipt
        fields = ['id', 'receipt_number', 'payment', 'amount', 'payment_method', 'issued_date', 'notes', 'student_name', 'admission_number', 'class_name']

class PaymentSerializer(serializers.ModelSerializer):
    receipt = ReceiptSerializer(read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    student_name = serializers.CharField(source='invoice.student.user.get_full_name', read_only=True)
    admission_number = serializers.CharField(source='invoice.student.admission_number', read_only=True)
    class_name = serializers.CharField(source='invoice.student.current_class.name', read_only=True)
    payment_date = serializers.DateField(required=False, default=timezone.localdate)
    received_by_name = serializers.CharField(source='received_by.get_full_name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'payment_number', 'invoice', 'invoice_number', 'student_name',
            'admission_number', 'class_name',
            'amount', 'payment_method', 'transaction_reference',
            'payment_date', 'received_by', 'received_by_name',
            'notes', 'created_at', 'receipt'
        ]
        read_only_fields = ['id', 'payment_number', 'created_at', 'receipt']

    def create(self, validated_data):
        if 'payment_number' not in validated_data or not validated_data['payment_number']:
            validated_data['payment_number'] = f"PAY-{int(time.time())}-{random.randint(1000, 9999)}"
        if 'payment_date' not in validated_data or not validated_data['payment_date']:
            validated_data['payment_date'] = timezone.now().date()
        if 'received_by' not in validated_data and 'request' in self.context:
            user = self.context['request'].user
            if user and user.is_authenticated:
                validated_data['received_by'] = user
        return super().create(validated_data)

class InvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_admission = serializers.CharField(source='student.admission_number', read_only=True)
    class_name = serializers.CharField(source='student.current_class.name', read_only=True)
    term_name = serializers.CharField(source='fee_structure.term.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'student', 'student_name', 'student_admission',
            'class_name', 'fee_structure', 'term_name',
            'total_amount', 'paid_amount', 'balance',
            'status', 'status_display', 'issued_date', 'due_date', 'payments'
        ]
        read_only_fields = ['id', 'invoice_number', 'paid_amount', 'balance', 'status', 'issued_date']

    def create(self, validated_data):
        student = validated_data.get('student')
        fee_structure = validated_data.get('fee_structure')
        
        adm = student.admission_number if student else 'STU'
        invoice_number = validated_data.get(
            'invoice_number',
            f"INV-{adm}-{int(time.time())}-{random.randint(100, 999)}"
        )
        total_amount = validated_data.get('total_amount')
        if not total_amount and fee_structure:
            total_amount = fee_structure.total_amount
            validated_data['total_amount'] = total_amount

        paid_amount = validated_data.get('paid_amount', Decimal('0.00'))
        validated_data['paid_amount'] = paid_amount
        validated_data['balance'] = max(Decimal('0.00'), (total_amount or Decimal('0.00')) - paid_amount)
        
        if 'due_date' not in validated_data or not validated_data['due_date']:
            if fee_structure and fee_structure.due_date:
                validated_data['due_date'] = fee_structure.due_date
            else:
                validated_data['due_date'] = timezone.now().date() + timezone.timedelta(days=30)
                
        validated_data['invoice_number'] = invoice_number
        if validated_data['balance'] == Decimal('0.00'):
            validated_data['status'] = InvoiceStatus.PAID
        elif paid_amount > Decimal('0.00'):
            validated_data['status'] = InvoiceStatus.PARTIAL
        else:
            validated_data['status'] = InvoiceStatus.UNPAID

        return super().create(validated_data)

class BulkGenerateInvoicesSerializer(serializers.Serializer):
    fee_structure_id = serializers.UUIDField()
