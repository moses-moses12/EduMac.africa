from rest_framework import viewsets, permissions
from django.db.models import Q
from apps.accounts.models import UserRole
from .models import Announcement
from .serializers import AnnouncementSerializer

class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['priority', 'is_active']
    search_fields = ['title', 'content']

    def get_queryset(self):
        user = self.request.user
        qs = Announcement.objects.all().select_related('posted_by')
        if user.role in [UserRole.ADMIN, UserRole.HEADMASTER]:
            return qs

        return qs.filter(
            is_active=True
        ).filter(
            Q(target_roles__icontains='ALL') | Q(target_roles__icontains=user.role)
        )

    def perform_create(self, serializer):
        serializer.save(posted_by=self.request.user)
