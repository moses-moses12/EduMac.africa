import time
import random
from decimal import Decimal
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.students.models import Student
from apps.fees.models import FeeStructure, Invoice, InvoiceStatus

@receiver(post_save, sender=Student)
def auto_generate_student_invoice(sender, instance, created, **kwargs):
    """
    Automatically creates a billing invoice when a student is created or updated
    with a current class that has an active FeeStructure.
    Ensures seamless communication between Student Registration and Billing.
    """
    if not instance.current_class or not instance.is_active:
        return

    # 1. Prefer fee structure matching current term
    fee_structure = FeeStructure.objects.filter(
        class_obj=instance.current_class,
        term__is_current=True
    ).first()

    # 2. Fallback to current academic year
    if not fee_structure:
        fee_structure = FeeStructure.objects.filter(
            class_obj=instance.current_class,
            academic_year__is_current=True
        ).first()

    # 3. Fallback to latest fee structure for this class
    if not fee_structure:
        fee_structure = FeeStructure.objects.filter(
            class_obj=instance.current_class
        ).order_by('-created_at').first()

    if not fee_structure:
        return

    # Check if an invoice already exists for this student and fee structure
    existing_invoice = Invoice.objects.filter(
        student=instance,
        fee_structure=fee_structure
    ).first()

    if not existing_invoice:
        invoice_num = f"INV-{instance.admission_number}-{int(time.time())}-{random.randint(100, 999)}"
        Invoice.objects.create(
            student=instance,
            fee_structure=fee_structure,
            invoice_number=invoice_num,
            total_amount=fee_structure.total_amount,
            paid_amount=Decimal('0.00'),
            balance=fee_structure.total_amount,
            status=InvoiceStatus.UNPAID,
            due_date=fee_structure.due_date
        )
