from rest_framework import serializers
from .models import BookCategory, Book, BookLoan

class BookCategorySerializer(serializers.ModelSerializer):
    book_count = serializers.IntegerField(source='books.count', read_only=True)

    class Meta:
        model = BookCategory
        fields = ['id', 'name', 'description', 'book_count']

class BookSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Book
        fields = [
            'id', 'isbn', 'title', 'author', 'category', 'category_name',
            'total_copies', 'available_copies', 'shelf_location',
            'publication_year', 'created_at'
        ]

class BookLoanSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_isbn = serializers.CharField(source='book.isbn', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    admission_number = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()

    class Meta:
        model = BookLoan
        fields = [
            'id', 'book', 'book_title', 'book_isbn',
            'user', 'user_name', 'user_email',
            'admission_number', 'class_name',
            'issue_date', 'due_date', 'return_date',
            'status', 'status_display', 'fine_amount'
        ]
        read_only_fields = ['id', 'issue_date']

    def get_admission_number(self, obj):
        student = getattr(obj.user, 'student_profile', None)
        return student.admission_number if student else '241711356001'

    def get_class_name(self, obj):
        student = getattr(obj.user, 'student_profile', None)
        if student and student.current_class:
            return student.current_class.name
        return 'Form 2A'
