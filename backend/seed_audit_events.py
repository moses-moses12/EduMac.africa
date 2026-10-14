import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from apps.audit.models import AuditLog, AuditAction
from apps.audit.utils import log_audit_event

admin_user = User.objects.filter(role='ADMIN').first()
teacher_user = User.objects.filter(role='TEACHER').first()
accountant_user = User.objects.filter(role='ACCOUNTANT').first()
exam_user = User.objects.filter(role='EXAM_OFFICER').first()

sample_events = [
    (admin_user, AuditAction.LOGIN, 'UserSession', 'sess-001', '192.168.1.10', {'auth_method': 'JWT', 'browser': 'Chrome/Win11'}),
    (admin_user, AuditAction.CREATE, 'Student', 'ADM-2026-0042', '192.168.1.10', {'name': 'Amani Mwinyi', 'class': 'Form 1'}),
    (teacher_user, AuditAction.RESULT_UPDATE, 'Marksheet', 'MS-TERM1-PHY', '192.168.1.45', {'subject': 'Physics', 'class': 'Form 3', 'students_scored': 38}),
    (exam_user, AuditAction.APPROVE, 'ExamSession', 'EXAM-2026-T1', '192.168.1.30', {'status': 'APPROVED', 'approved_by': 'Exam Officer'}),
    (exam_user, AuditAction.PUBLISH, 'ExamResults', 'RES-2026-T1', '192.168.1.30', {'published_scope': 'ALL_STUDENTS', 'total_candidates': 124}),
    (accountant_user, AuditAction.PAYMENT, 'FeePayment', 'REC-2026-0089', '192.168.1.22', {'amount': 450000, 'currency': 'TZS', 'method': 'M-PESA', 'ref': 'MPESA78942'}),
    (admin_user, AuditAction.ROLE_CHANGE, 'User', 'usr-staff-04', '192.168.1.10', {'target_user': 'staff@school.edu', 'old_role': 'STAFF', 'new_role': 'RECEPTION'}),
    (admin_user, AuditAction.PASSWORD_CHANGE, 'User', 'usr-admin-01', '192.168.1.10', {'status': 'SUCCESS', 'forced_reset': False}),
    (teacher_user, AuditAction.UPDATE, 'Assignment', 'ASG-2026-015', '192.168.1.45', {'title': 'Calculus Differential Equations', 'due_extended': True}),
    (admin_user, AuditAction.DELETE, 'TimetableSlot', 'SLOT-99', '192.168.1.10', {'subject': 'Biology Practical', 'reason': 'Holiday reschedule'}),
    (teacher_user, AuditAction.LOGOUT, 'UserSession', 'sess-002', '192.168.1.45', {'duration_minutes': 142}),
]

for user, action, obj_type, obj_id, ip, meta in sample_events:
    log_audit_event(user=user, action=action, object_type=obj_type, object_id=obj_id, ip_address=ip, metadata=meta)

print(f"Successfully seeded {len(sample_events)} audit events!")
print(f"Total AuditLog count in DB: {AuditLog.objects.count()}")
