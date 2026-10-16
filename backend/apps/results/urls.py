from core.routers import OptionalSlashRouter
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ResultViewSet, StudentMyResultsView

router = OptionalSlashRouter()
router.register(r'scores', ResultViewSet, basename='result')
router.register(r'', ResultViewSet, basename='result-root')

urlpatterns = [
    path('me/', StudentMyResultsView.as_view(), name='results-me'),
    path('', include(router.urls)),
]
