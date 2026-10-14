from rest_framework import viewsets
from core.permissions import IsAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().select_related('user')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ['action', 'object_type', 'model_name']
    search_fields = ['user__email', 'object_type', 'model_name', 'object_id', 'ip_address']
    ordering_fields = ['timestamp', 'action', 'object_type']
