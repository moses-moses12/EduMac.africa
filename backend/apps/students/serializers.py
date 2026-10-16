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

def generate_next_admission_number():
    """
    Generate sequential 12-digit admission number starting at 241711356001.
    """
    base_prefix = 241711356000
    highest = base_prefix

    for s in Student.objects.filter(admission_number__startswith="241711356").only('admission_number'):
        try:
            val = int(s.admission_number)
            if val > highest:
                highest = val
        except (ValueError, TypeError):
            continue

    if highest == base_prefix:
        total = Student.objects.count()
        candidate_num = base_prefix + max(total + 1, 1)
    else:
        candidate_num = highest + 1

    candidate = str(candidate_num)
    while Student.objects.filter(admission_number=candidate).exists():
        candidate_num += 1
        candidate = str(candidate_num)

    return candidate

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

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)

        # 1. Resolve current_class if string name or partial provided
        raw_class = data.get('current_class') or data.get('class_name')
        if raw_class:
            try:
                uuid.UUID(str(raw_class))
            except (ValueError, AttributeError):
                class_obj = Class.objects.filter(name__iexact=str(raw_class).strip()).first()
                if not class_obj:
                    clean_name = str(raw_class).split()[0]
                    class_obj = Class.objects.filter(name__icontains=clean_name).first()
                if not class_obj:
                    class_obj = Class.objects.first()
                if class_obj:
                    data['current_class'] = str(class_obj.id)
                else:
                    data.pop('current_class', None)

        # 2. Resolve current_stream if string name or partial provided
        raw_stream = data.get('current_stream') or data.get('stream_name')
        if raw_stream:
            try:
                uuid.UUID(str(raw_stream))
            except (ValueError, AttributeError):
                stream_obj = Stream.objects.filter(name__icontains=str(raw_stream).strip()).first()
                if not stream_obj and data.get('current_class'):
                    stream_obj = Stream.objects.filter(class_obj_id=data.get('current_class')).first()
                if not stream_obj:
                    stream_obj = Stream.objects.first()
                if stream_obj:
                    data['current_stream'] = str(stream_obj.id)
                else:
                    data.pop('current_stream', None)

        # 3. Resolve academic_year if missing
        if not data.get('academic_year'):
            ay = AcademicYear.objects.filter(is_current=True).first() or AcademicYear.objects.first()
            if ay:
                data['academic_year'] = str(ay.id)

        # 4. If full_name provided but first_name / last_name missing
        if data.get('full_name') and not data.get('first_name'):
            parts = str(data['full_name']).strip().split(' ', 1)
            data['first_name'] = parts[0]
            data['last_name'] = parts[1] if len(parts) > 1 else 'Student'

        # 5. Ensure admission number exists and is strictly unique (format: 241711356001 and onwards)
        raw_adm = data.get('admission_number')
        if not raw_adm or not str(raw_adm).strip():
            data['admission_number'] = generate_next_admission_number()
        else:
            adm = str(raw_adm).strip()
            if Student.objects.filter(admission_number=adm).exists():
                try:
                    num = int(adm)
                    candidate = str(num + 1)
                    while Student.objects.filter(admission_number=candidate).exists():
                        num += 1
                        candidate = str(num + 1)
                    data['admission_number'] = candidate
                except (ValueError, TypeError):
                    base_adm = adm
                    counter = 1
                    new_adm = f"{base_adm}-{counter}"
                    while Student.objects.filter(admission_number=new_adm).exists():
                        counter += 1
                        new_adm = f"{base_adm}-{counter}"
                    data['admission_number'] = new_adm

        # 6. Sanitize profile_photo so non-URL strings like "stu.jpg" or empty values never trigger URLField errors
        raw_photo = data.get('profile_photo')
        if raw_photo:
            val = str(raw_photo).strip()
            if not (val.startswith('http://') or val.startswith('https://')):
                data.pop('profile_photo', None)
        elif 'profile_photo' in data:
            data.pop('profile_photo', None)

        return super().to_internal_value(data)

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

        # 0. Ensure unique admission number (format: 241711356001 and onwards)
        admission_number = validated_data.get('admission_number')
        if not admission_number:
            admission_number = generate_next_admission_number()
        elif Student.objects.filter(admission_number=admission_number).exists():
            try:
                num = int(admission_number)
                candidate = str(num + 1)
                while Student.objects.filter(admission_number=candidate).exists():
                    num += 1
                    candidate = str(num + 1)
                admission_number = candidate
            except (ValueError, TypeError):
                base_adm = admission_number
                counter = 1
                while Student.objects.filter(admission_number=admission_number).exists():
                    admission_number = f"{base_adm}-{counter}"
                    counter += 1
        validated_data['admission_number'] = admission_number

        with transaction.atomic():
            # 1. Resolve or Create Student User Account
            if user_id:
                user = User.objects.get(id=user_id)
            else:
                if not email:
                    clean_adm = admission_number.lower().replace(' ', '').replace('/', '-')
                    email = f"{clean_adm}@school.edu"

                base_email = email
                cnt = 1
                while User.objects.filter(email=email).exists() and hasattr(User.objects.get(email=email), 'student_profile'):
                    parts = base_email.split('@')
                    email = f"{parts[0]}_{cnt}@{parts[1] if len(parts) > 1 else 'school.edu'}"
                    cnt += 1

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
                    p_last = names[1] if len(names) > 1 else 'Parent'
                    try:
                        parent_user = User.objects.create_user(
                            email=p_email,
                            password='Parent123!',
                            first_name=p_first,
                            last_name=p_last,
                            role=UserRole.PARENT,
                            phone_number=parent_phone or None
                        )
                    except Exception:
                        parent_user = User.objects.filter(email=p_email).first()
                if parent_user:
                    rel_type = parent_rel if parent_rel in ['FATHER', 'MOTHER', 'GUARDIAN'] else 'GUARDIAN'
                    parent_profile, _ = Parent.objects.get_or_create(
                        user=parent_user,
                        defaults={
                            'relationship_type': rel_type,
                            'alternate_phone': parent_phone or ''
                        }
                    )
                    validated_data['parent'] = parent_profile

            if phone_number:
                validated_data['phone_number'] = phone_number

            if not validated_data.get('current_class'):
                first_cls = Class.objects.first()
                if first_cls:
                    validated_data['current_class'] = first_cls

            if not validated_data.get('academic_year'):
                current_year = AcademicYear.objects.filter(is_current=True).first() or AcademicYear.objects.first()
                if current_year:
                    validated_data['academic_year'] = current_year

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
