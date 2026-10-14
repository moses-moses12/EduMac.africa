from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['is_read', 'notification_type']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'is_read']

    def get_queryset(self):
        qs = Notification.objects.filter(user=self.request.user).select_related('user')
        
        # Explicit type / category filter
        notif_type = self.request.query_params.get('type') or self.request.query_params.get('notification_type')
        if notif_type:
            qs = qs.filter(notification_type=notif_type)
            
        # Boolean read filter
        is_read_param = self.request.query_params.get('is_read')
        if is_read_param is not None:
            if is_read_param.lower() in ['true', '1']:
                qs = qs.filter(is_read=True)
            elif is_read_param.lower() in ['false', '0']:
                qs = qs.filter(is_read=False)
                
        # Keyword search
        search_query = self.request.query_params.get('search')
        if search_query:
            qs = qs.filter(Q(title__icontains=search_query) | Q(message__icontains=search_query))
            
        return qs

    def perform_create(self, serializer):
        target_user = self.request.user
        recipient_id = self.request.data.get('recipient') or self.request.data.get('user')
        
        # Privileged roles may dispatch notifications to targeted users
        if recipient_id and self.request.user.role in ['ADMIN', 'HEADMASTER', 'STAFF', 'TEACHER']:
            from apps.accounts.models import User
            found_user = User.objects.filter(id=recipient_id).first()
            if found_user:
                target_user = found_user
                
        notif_type = (
            self.request.data.get('type') or
            self.request.data.get('notification_type') or
            'GENERAL'
        )
        serializer.save(user=target_user, notification_type=notif_type)

    @action(detail=True, methods=['post', 'patch'], url_path='read')
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({"success": True, "message": "Notification marked as read."})

    @action(detail=False, methods=['post'], url_path='read-all')
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"success": True, "updated_count": updated, "message": f"{updated} notifications marked as read."})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"success": True, "unread_count": count})

    @action(detail=False, methods=['post'], url_path='broadcast')
    def broadcast(self, request):
        """Dispatch notifications to all users or role-targeted recipients."""
        if request.user.role not in ['ADMIN', 'HEADMASTER', 'STAFF']:
            return Response(
                {"error": "Forbidden: Only institutional administrators may broadcast notifications."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        title = request.data.get('title')
        message = request.data.get('message')
        target_role = request.data.get('target_role', 'ALL')
        notif_type = request.data.get('type') or request.data.get('notification_type') or 'SCHOOL_ANNOUNCEMENT'
        
        if not title or not message:
            return Response(
                {"error": "Title and message are required fields."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        from apps.accounts.models import User
        if target_role == 'ALL':
            target_users = User.objects.all()
        else:
            target_users = User.objects.filter(role=target_role)
            
        notifications = [
            Notification(
                user=u,
                title=title,
                message=message,
                notification_type=notif_type,
                is_read=False,
            )
            for u in target_users
        ]
        created = Notification.objects.bulk_create(notifications)
        return Response({
            "success": True,
            "count": len(created),
            "target_role": target_role,
            "message": f"Broadcast alert successfully dispatched to {len(created)} recipients."
        })
