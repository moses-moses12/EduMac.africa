from datetime import datetime
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from apps.accounts.models import UserRole
from apps.students.models import Student
from apps.academics.models import Stream, Subject
from .models import Attendance, AttendanceStatus, AttendanceType
from .serializers import AttendanceSerializer, BulkAttendanceSerializer

class StudentMyAttendanceView(APIView):
    """
    Self-service endpoint deriving student identity strictly from the authenticated session.
    - Students: See ONLY their own attendance history, rate, and monthly summaries.
    - Parents: See attendance of their linked children. Supports ?student_id= query param.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        student = None
        linked_children = []

        if user.role == UserRole.STUDENT:
            student = Student.objects.filter(user=user).select_related('user', 'current_class', 'current_stream').first()
        elif user.role == UserRole.PARENT:
            parent_profile = getattr(user, 'parent_profile', None)
            if parent_profile:
                children = parent_profile.children.all().select_related('user', 'current_class', 'current_stream')
                linked_children = [
                    {
                        "id": str(c.id),
                        "admission_number": c.admission_number,
                        "name": c.user.get_full_name(),
                        "class_name": c.current_class.name if c.current_class else "N/A",
                        "stream_name": c.current_stream.name if c.current_stream else "N/A"
                    } for c in children
                ]
                requested_student_id = request.query_params.get('student_id')
                if requested_student_id:
                    student = children.filter(id=requested_student_id).first()
                else:
                    student = children.first()
        else:
            return Response(
                {"error": "This endpoint is restricted to authenticated students and guardians."},
                status=status.HTTP_403_FORBIDDEN
            )

        if not student:
            return Response(
                {"error": "No student profile associated with this account."},
                status=status.HTTP_404_NOT_FOUND
            )

        records = Attendance.objects.filter(student=student).select_related('subject', 'stream').order_by('-date')
        total = records.count()
        present = records.filter(status=AttendanceStatus.PRESENT).count()
        late = records.filter(status=AttendanceStatus.LATE).count()
        absent = records.filter(status=AttendanceStatus.ABSENT).count()
        excused = records.filter(status=AttendanceStatus.EXCUSED).count()
        rate = round(((present + late) / total) * 100, 1) if total > 0 else 100.0

        # Monthly breakdown
        monthly_data = (
            records.annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(
                total=Count('id'),
                present=Count('id', filter=Q(status=AttendanceStatus.PRESENT)),
                late=Count('id', filter=Q(status=AttendanceStatus.LATE)),
                absent=Count('id', filter=Q(status=AttendanceStatus.ABSENT)),
                excused=Count('id', filter=Q(status=AttendanceStatus.EXCUSED)),
            )
            .order_by('-month')
        )

        monthly_summaries = []
        for m in monthly_data:
            m_total = m['total']
            m_present = m['present']
            m_late = m['late']
            m_rate = round(((m_present + m_late) / m_total) * 100, 1) if m_total > 0 else 100.0
            month_date = m['month']
            monthly_summaries.append({
                "month": month_date.strftime('%B %Y') if month_date else "Unknown",
                "month_code": month_date.strftime('%Y-%m') if month_date else "",
                "total": m_total,
                "present": m_present,
                "late": m_late,
                "absent": m['absent'],
                "excused": m['excused'],
                "attendance_rate": m_rate
            })

        return Response({
            "student_id": str(student.id),
            "student_admission": student.admission_number,
            "student_name": student.user.get_full_name(),
            "class_name": student.current_class.name if student.current_class else "N/A",
            "stream_name": student.current_stream.name if student.current_stream else "N/A",
            "linked_children": linked_children,
            "summary": {
                "total_days": total,
                "present": present,
                "late": late,
                "absent": absent,
                "excused": excused,
                "attendance_rate": rate
            },
            "monthly_summaries": monthly_summaries,
            "records": AttendanceSerializer(records[:100], many=True).data
        })


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['stream', 'date', 'status', 'student', 'attendance_type', 'subject']
    search_fields = ['student__admission_number', 'student__user__first_name', 'student__user__last_name']

    def get_queryset(self):
        user = self.request.user
        queryset = Attendance.objects.all().select_related('student__user', 'stream', 'subject', 'recorded_by')
        if user.role == UserRole.STUDENT:
            return queryset.filter(student__user=user)
        elif user.role == UserRole.PARENT:
            return queryset.filter(student__parent__user=user)
        elif user.role == UserRole.TEACHER:
            teacher = getattr(user, 'teacher_profile', None)
            if not teacher:
                return queryset.none()
            assigned_classes = teacher.teaching_assignments.values_list('class_obj_id', flat=True)
            assigned_streams = teacher.teaching_assignments.filter(stream__isnull=False).values_list('stream_id', flat=True)
            return queryset.filter(
                Q(stream_id__in=assigned_streams) |
                Q(stream__class_obj_id__in=assigned_classes) |
                Q(recorded_by=user)
            ).distinct()
        return queryset

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)

    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        """Allows teachers or administrators to mark daily or subject attendance for a stream in batch."""
        serializer = BulkAttendanceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        date = serializer.validated_data['date']
        stream_id = serializer.validated_data.get('stream_id')
        attendance_type = serializer.validated_data.get('attendance_type', AttendanceType.DAILY)
        subject_id = serializer.validated_data.get('subject_id')
        records = serializer.validated_data['records']

        # Strict Teacher Scoping: cannot mark attendance for unrelated streams/classes
        if request.user.role == UserRole.TEACHER:
            teacher = getattr(request.user, 'teacher_profile', None)
            if not teacher:
                return Response({"error": "Teacher profile not found."}, status=status.HTTP_403_FORBIDDEN)
            if stream_id:
                is_assigned = teacher.teaching_assignments.filter(
                    Q(stream_id=stream_id) | Q(class_obj__streams__id=stream_id)
                ).exists()
                if not is_assigned:
                    return Response(
                        {"error": "Access Denied: You are not assigned to record attendance for this stream."},
                        status=status.HTTP_403_FORBIDDEN
                    )

        created_count = 0
        updated_count = 0

        for item in records:
            obj, created = Attendance.objects.update_or_create(
                student_id=item['student_id'],
                date=date,
                attendance_type=attendance_type,
                subject_id=subject_id if attendance_type == AttendanceType.SUBJECT else None,
                defaults={
                    'stream_id': stream_id,
                    'status': item['status'],
                    'notes': item.get('notes', ''),
                    'recorded_by': request.user,
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        return Response({
            "success": True,
            "message": f"Successfully processed attendance: {created_count} created, {updated_count} updated.",
            "date": date,
            "attendance_type": attendance_type,
            "stream_id": stream_id,
            "subject_id": subject_id
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Aggregate attendance stats for the requesting context."""
        qs = self.get_queryset()
        stream_id = request.query_params.get('stream')
        if stream_id:
            qs = qs.filter(stream_id=stream_id)

        subject_id = request.query_params.get('subject')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        attendance_type = request.query_params.get('attendance_type')
        if attendance_type:
            qs = qs.filter(attendance_type=attendance_type)

        date_param = request.query_params.get('date')
        if date_param:
            qs = qs.filter(date=date_param)

        total = qs.count()
        if total == 0:
            return Response({
                "total_records": 0,
                "present": 0,
                "absent": 0,
                "late": 0,
                "excused": 0,
                "present_rate": 100.0
            })

        present = qs.filter(status=AttendanceStatus.PRESENT).count()
        absent = qs.filter(status=AttendanceStatus.ABSENT).count()
        late = qs.filter(status=AttendanceStatus.LATE).count()
        excused = qs.filter(status=AttendanceStatus.EXCUSED).count()
        present_rate = round(((present + late) / total) * 100, 2)

        return Response({
            "total_records": total,
            "present": present,
            "absent": absent,
            "late": late,
            "excused": excused,
            "present_rate": present_rate
        })

    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        """Monthly aggregated attendance report."""
        qs = self.get_queryset()
        student_id = request.query_params.get('student')
        if student_id:
            qs = qs.filter(student_id=student_id)

        stream_id = request.query_params.get('stream')
        if stream_id:
            qs = qs.filter(stream_id=stream_id)

        monthly_data = (
            qs.annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(
                total=Count('id'),
                present=Count('id', filter=Q(status=AttendanceStatus.PRESENT)),
                late=Count('id', filter=Q(status=AttendanceStatus.LATE)),
                absent=Count('id', filter=Q(status=AttendanceStatus.ABSENT)),
                excused=Count('id', filter=Q(status=AttendanceStatus.EXCUSED)),
            )
            .order_by('-month')
        )

        result = []
        for m in monthly_data:
            m_total = m['total']
            m_present = m['present']
            m_late = m['late']
            m_rate = round(((m_present + m_late) / m_total) * 100, 2) if m_total > 0 else 100.0
            month_date = m['month']
            result.append({
                "month_name": month_date.strftime('%B %Y') if month_date else "Unknown",
                "month_code": month_date.strftime('%Y-%m') if month_date else "",
                "total": m_total,
                "present": m_present,
                "late": m_late,
                "absent": m['absent'],
                "excused": m['excused'],
                "attendance_percentage": m_rate
            })

        return Response({"monthly_summaries": result})

    @action(detail=False, methods=['get'])
    def reports(self, request):
        """Comprehensive administrative and teacher report on class attendance and at-risk students."""
        user = request.user
        if user.role in [UserRole.STUDENT, UserRole.PARENT]:
            return Response(
                {"error": "Class and institution attendance reports are restricted to staff and administration."},
                status=status.HTTP_403_FORBIDDEN
            )

        stream_id = request.query_params.get('stream')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        qs = Attendance.objects.all()
        if stream_id:
            qs = qs.filter(stream_id=stream_id)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        # Aggregate student attendance rates to identify chronic absenteeism (< 75%)
        student_stats = (
            qs.values('student__id', 'student__admission_number', 'student__user__first_name', 'student__user__last_name', 'stream__name')
            .annotate(
                total=Count('id'),
                present=Count('id', filter=Q(status=AttendanceStatus.PRESENT)),
                late=Count('id', filter=Q(status=AttendanceStatus.LATE)),
                absent=Count('id', filter=Q(status=AttendanceStatus.ABSENT)),
                excused=Count('id', filter=Q(status=AttendanceStatus.EXCUSED)),
            )
        )

        students_report = []
        chronic_absenteeism = []
        for s in student_stats:
            tot = s['total']
            att_rate = round(((s['present'] + s['late']) / tot) * 100, 1) if tot > 0 else 100.0
            row = {
                "student_id": str(s['student__id']),
                "admission_number": s['student__admission_number'],
                "name": f"{s['student__user__first_name']} {s['student__user__last_name']}".strip(),
                "stream": s['stream__name'] or "N/A",
                "total_days": tot,
                "present": s['present'],
                "late": s['late'],
                "absent": s['absent'],
                "excused": s['excused'],
                "attendance_percentage": att_rate
            }
            students_report.append(row)
            if att_rate < 75.0 and tot >= 5:
                chronic_absenteeism.append(row)

        total_records = qs.count()
        total_present = qs.filter(status=AttendanceStatus.PRESENT).count()
        total_late = qs.filter(status=AttendanceStatus.LATE).count()
        overall_rate = round(((total_present + total_late) / total_records) * 100, 2) if total_records > 0 else 100.0

        return Response({
            "overall_summary": {
                "total_records": total_records,
                "present": total_present,
                "late": total_late,
                "absent": qs.filter(status=AttendanceStatus.ABSENT).count(),
                "excused": qs.filter(status=AttendanceStatus.EXCUSED).count(),
                "overall_attendance_rate": overall_rate,
            },
            "chronic_absenteeism_count": len(chronic_absenteeism),
            "chronic_absenteeism": chronic_absenteeism,
            "students_breakdown": students_report
        })
