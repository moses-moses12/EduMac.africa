from rest_framework import serializers
from .models import Teacher, Staff
from apps.accounts.serializers import UserSerializer

class TeacherSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone_number', read_only=True)

    class Meta:
        model = Teacher
        fields = [
            'id', 'user', 'user_id', 'full_name', 'email', 'phone',
            'employee_id', 'qualification', 'specialization',
            'joining_date', 'is_active', 'created_at'
        ]

class StaffSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone_number', read_only=True)

    class Meta:
        model = Staff
        fields = [
            'id', 'user', 'user_id', 'full_name', 'email', 'phone',
            'employee_id', 'department', 'designation',
            'joining_date', 'is_active', 'created_at'
        ]
