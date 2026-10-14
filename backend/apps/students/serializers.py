import uuid
from rest_framework import serializers
from django.db import transaction
from django.contrib.auth import get_user_model
from .models import Parent, Student, StudentEnrollment, GenderChoice
from apps.accounts.models import UserRole
from apps.accounts.serializers import UserSerializer
from apps.academics.models import Class, Stream, AcademicYear
from apps.academics.serializers import ClassSerializer, StreamSerializer

User = get_user_model()

class ParentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone_number', read_only=True)

    children = serializers.SerializerMethodField()

    class Meta:
        model = Parent
        fields = [
            'id', 'user', 'full_name', 'email', 'phone',
            'relationship_type', 'occupation', 'alternate_phone', 'children'
        ]

    def get_children(self, obj):
        return [
            {
                "id": str(c.id),
                "admission_number": c.admission_number,
                "full_name": c.user.get_full_name(),
                "first_name": c.user.first_name,
                "last_name": c.user.last_name,
                "class_name": c.current_class.name if c.current_class else "N/A",
                "stream_name": c.current_stream.name if c.current_stream else "N/A",
                "gender": c.gender,
                "status": c.status,
            }
            for c in obj.children.all().select_related('user', 'current_class', 'current_stream')
        ]

class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    parent = ParentSerializer(read_only=True)
    parent_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    
    # Write-only helper fields for rich direct student registration
    first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    parent_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    parent_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    parent_relationship = serializers.CharField(write_only=True, required=False, default='GUARDIAN')
    password = serializers.CharField(write_only=True, required=False, default='Student123!')

    gender = serializers.CharField(required=False, default='MALE')
    class_name = serializers.CharField(source='current_class.name', read_only=True)
    stream_name = serializers.CharField(source='current_stream.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'user', 'user_id', 'full_name', 'email',
            'first_name', 'last_name', 'phone_number', 'password',
            'admission_number', 'parent', 'parent_id',
            'parent_name', 'parent_phone', 'parent_relationship',
            'date_of_birth', 'gender', 'gender_display',
            'blood_group', 'emergency_contact', 'address', 'profile_photo',
            'academic_year', 'academic_year_name',
            'current_class', 'class_name',
            'current_stream', 'stream_name',
            'status', 'status_display',
            'admission_date', 'is_active', 'created_at'
        ]

    def validate_gender(self, value):
        val = str(value).upper()
        if val in ['M', 'MALE']:
            return GenderChoice.MALE
        elif val in ['F', 'FEMALE']:
            return GenderChoice.FEMALE
        return GenderChoice.OTHER

    def create(self, validated_data):
        # Extract user creation fields
        first_name = validated_data.pop('first_name', '').strip()
        last_name = validated_data.pop('last_name', '').strip()
        email = validated_data.pop('email', None)
        phone_number = validated_data.pop('phone_number', '').strip()
        password = validated_data.pop('password', 'Student123!')
        user_id = validated_data.pop('user_id', None)

        # Extract parent helper fields
        parent_name = validated_data.pop('parent_name', '').strip()
        parent_phone = validated_data.pop('parent_phone', '').strip()
        parent_rel = validated_data.pop('parent_relationship', 'GUARDIAN')
        parent_id = validated_data.pop('parent_id', None)

        admission_number = validated_data.get('admission_number')

        with transaction.atomic():
            # 1. Resolve or Create Student User Account
            if user_id:
                user = User.objects.get(id=user_id)
            else:
                if not email:
                    clean_adm = admission_number.lower().replace(' ', '').replace('/', '-')
                    email = f"{clean_adm}@school.edu"

                user = User.objects.filter(email=email).first()
                if not user:
                    user = User.objects.create_user(
                        email=email,
                        password=password,
                        first_name=first_name or admission_number,
                        last_name=last_name or 'Student',
                        role=UserRole.STUDENT,
                        phone_number=phone_number or None
                    )
                else:
                    if first_name:
                        user.first_name = first_name
                    if last_name:
                        user.last_name = last_name
                    user.role = UserRole.STUDENT
                    user.save()

            validated_data['user'] = user

            # 2. Resolve or Create Parent
            if parent_id:
                validated_data['parent'] = Parent.objects.filter(id=parent_id).first()
            elif parent_name or parent_phone:
                p_email = f"parent.{user.email}"
                parent_user = User.objects.filter(email=p_email).first()
                if not parent_user:
                    names = parent_name.split(' ', 1) if parent_name else ['Guardian', 'Parent']
                    p_first = names[0]
                    p_last = names[1] if len(names) > 1 else ''
                    parent_user = User.objects.create_user(
                        email=p_email,
                        password='Parent123!',
                        first_name=p_first,
                        last_name=p_last,
                        role=UserRole.PARENT,
                        phone_number=parent_phone or None
                    )
                parent_profile, _ = Parent.objects.get_or_create(
                    user=parent_user,
                    defaults={
                        'relationship_type': parent_rel,
                        'alternate_phone': parent_phone or ''
                    }
                )
                validated_data['parent'] = parent_profile

            if phone_number:
                validated_data['phone_number'] = phone_number

            # 3. Create Student Instance
            student = Student.objects.create(**validated_data)

            # 4. Auto-enroll into active AcademicYear if exists
            current_year = AcademicYear.objects.filter(is_current=True).first() or AcademicYear.objects.first()
            if current_year and student.current_class:
                StudentEnrollment.objects.get_or_create(
                    student=student,
                    academic_year=current_year,
                    defaults={
                        'class_obj': student.current_class,
                        'stream': student.current_stream,
                        'status': 'ACTIVE'
                    }
                )

            return student

    def update(self, instance, validated_data):
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        email = validated_data.pop('email', None)
        phone_number = validated_data.pop('phone_number', None)

        if instance.user:
            updated = False
            if first_name is not None:
                instance.user.first_name = first_name
                updated = True
            if last_name is not None:
                instance.user.last_name = last_name
                updated = True
            if email is not None:
                instance.user.email = email
                updated = True
            if phone_number is not None:
                instance.user.phone_number = phone_number
                updated = True
            if updated:
                instance.user.save()

        return super().update(instance, validated_data)

class StudentEnrollmentSerializer(serializers.ModelSerializer):
    student_admission = serializers.CharField(source='student.admission_number', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    stream_name = serializers.CharField(source='stream.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = StudentEnrollment
        fields = [
            'id', 'student', 'student_admission', 'student_name',
            'academic_year', 'academic_year_name',
            'class_obj', 'class_name',
            'stream', 'stream_name',
            'status', 'enrollment_date'
        ]
