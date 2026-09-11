from django.urls import path
from .views import HealthCheckView, DemoMessagesView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='api-health'),
    path('messages/', DemoMessagesView.as_view(), name='api-messages'),
]
