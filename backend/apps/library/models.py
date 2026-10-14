import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

class BookCategory(models.Model):
    """Subject or genre category for library holdings."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = _('Book Categories')

    def __str__(self):
        return self.name

class Book(models.Model):
    """Physical or digital book in library catalog."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    isbn = models.CharField(max_length=30, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=200)
    category = models.ForeignKey(BookCategory, on_delete=models.SET_NULL, null=True, related_name='books')
    total_copies = models.PositiveIntegerField(default=1)
    available_copies = models.PositiveIntegerField(default=1)
    shelf_location = models.CharField(max_length=100, blank=True)
    publication_year = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return f"{self.title} by {self.author} ({self.available_copies}/{self.total_copies} available)"

class LoanStatus(models.TextChoices):
    BORROWED = 'BORROWED', _('Borrowed')
    RETURNED = 'RETURNED', _('Returned')
    OVERDUE = 'OVERDUE', _('Overdue')
    LOST = 'LOST', _('Lost')

class BookLoan(models.Model):
    """Circulation record for books issued to students or faculty."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='loans')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='book_loans')
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=LoanStatus.choices, default=LoanStatus.BORROWED)
    fine_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-issue_date']
        indexes = [
            models.Index(fields=['status', 'due_date']),
        ]

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_status = None
        if not is_new:
            old_inst = BookLoan.objects.filter(pk=self.pk).first()
            if old_inst:
                old_status = old_inst.status

        super().save(*args, **kwargs)

        if is_new and self.status == LoanStatus.BORROWED:
            if self.book.available_copies > 0:
                self.book.available_copies -= 1
                self.book.save(update_fields=['available_copies'])
        elif old_status == LoanStatus.BORROWED and self.status == LoanStatus.RETURNED:
            self.book.available_copies += 1
            self.book.save(update_fields=['available_copies'])

    def __str__(self):
        return f"{self.book.title} -> {self.user.email} [{self.get_status_display()}]"
