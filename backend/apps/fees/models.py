import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from apps.academics.models import AcademicYear, Term, Class
from apps.students.models import Student

class FeeStructure(models.Model):
    """Institutional billing schedule defined per Class and Term."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='fee_structures')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='fee_structures')
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='fee_structures', verbose_name=_('Class'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    due_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('academic_year', 'term', 'class_obj')
        ordering = ['academic_year', 'term', 'class_obj']

    def update_total_from_items(self):
        total = self.items.aggregate(models.Sum('amount'))['amount__sum'] or Decimal('0.00')
        self.total_amount = total
        self.save(update_fields=['total_amount'])

    def __str__(self):
        return f"{self.class_obj.name} - {self.term.name} ({self.total_amount})"

class FeeItem(models.Model):
    """Itemized breakdown of charges in a fee structure (e.g. Tuition, Lab, Library)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_mandatory = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.fee_structure.update_total_from_items()

    def __str__(self):
        return f"{self.name}: {self.amount}"

class InvoiceStatus(models.TextChoices):
    PAID = 'PAID', _('Paid')
    PARTIAL = 'PARTIAL', _('Partially Paid')
    UNPAID = 'UNPAID', _('Unpaid')
    OVERDUE = 'OVERDUE', _('Overdue')

class Invoice(models.Model):
    """Student billing statement."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='invoices')
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.CASCADE, related_name='invoices')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    balance = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=InvoiceStatus.choices, default=InvoiceStatus.UNPAID)
    issued_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-issued_date']
        indexes = [
            models.Index(fields=['status', 'due_date']),
        ]

    def recalculate(self):
        total_paid = self.payments.aggregate(models.Sum('amount'))['amount__sum'] or Decimal('0.00')
        self.paid_amount = total_paid
        self.balance = max(Decimal('0.00'), self.total_amount - total_paid)
        if self.balance <= Decimal('0.00'):
            self.status = InvoiceStatus.PAID
        elif self.paid_amount > Decimal('0.00'):
            self.status = InvoiceStatus.PARTIAL
        else:
            self.status = InvoiceStatus.UNPAID
        self.save()

    def __str__(self):
        return f"{self.invoice_number} - {self.student.admission_number} [{self.get_status_display()}]"

class PaymentMethod(models.TextChoices):
    BANK_TRANSFER = 'BANK_TRANSFER', _('Bank Transfer')
    CASH = 'CASH', _('Cash')
    CREDIT_CARD = 'CREDIT_CARD', _('Credit/Debit Card')
    MOBILE_MONEY = 'MOBILE_MONEY', _('Mobile Money')
    CHEQUE = 'CHEQUE', _('Cheque')

class Payment(models.Model):
    """Financial transaction settling an invoice."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment_number = models.CharField(max_length=50, unique=True, db_index=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.BANK_TRANSFER)
    transaction_reference = models.CharField(max_length=100, blank=True)
    payment_date = models.DateField()
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-payment_date', '-created_at']
        indexes = [
            models.Index(fields=['payment_date']),
            models.Index(fields=['payment_method']),
        ]

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        self.invoice.recalculate()
        if is_new or not Receipt.objects.filter(payment=self).exists():
            Receipt.objects.get_or_create(
                payment=self,
                defaults={
                    'receipt_number': f"REC-{self.payment_number}",
                    'notes': f"Receipt issued for payment {self.payment_number}"
                }
            )

    def __str__(self):
        return f"{self.payment_number} - {self.amount} for {self.invoice.invoice_number}"

class Receipt(models.Model):
    """Official issued receipt acknowledging payment."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    receipt_number = models.CharField(max_length=50, unique=True, db_index=True)
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='receipt')
    issued_date = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-issued_date']

    def __str__(self):
        return f"{self.receipt_number} (Amt: {self.payment.amount})"
