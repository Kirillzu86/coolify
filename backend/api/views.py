import sys
from datetime import datetime, timezone
import django
from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class HealthCheckView(APIView):
    """
    Health check endpoint returning system status, database connectivity,
    and server info.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        db_status = "ok"
        db_engine = connection.settings_dict.get('ENGINE', 'unknown').split('.')[-1]
        try:
            connection.ensure_connection()
        except Exception as e:
            db_status = f"error: {str(e)}"

        return Response({
            "status": "healthy" if db_status == "ok" else "degraded",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "python_version": sys.version.split()[0],
            "django_version": django.get_version(),
            "database": {
                "status": db_status,
                "engine": db_engine,
            },
            "host": request.get_host(),
            "scheme": request.scheme,
        }, status=status.HTTP_200_OK)


# In-memory storage for simple demo ping/messages if DB models aren't migrated yet
_DEMO_MESSAGES = [
    {"id": 1, "text": "Coolify Backend готов к работе!", "created_at": "2026-09-11T10:00:00Z"},
    {"id": 2, "text": "Связь Frontend (React+TS) -> Backend (Django) установлена.", "created_at": "2026-09-11T10:01:00Z"},
]


class DemoMessagesView(APIView):
    """
    Demo endpoint allowing GET and POST to verify API interactivity,
    CORS, and CSRF settings from React.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({
            "count": len(_DEMO_MESSAGES),
            "results": _DEMO_MESSAGES
        }, status=status.HTTP_200_OK)

    def post(self, request):
        text = request.data.get("text", "").strip()
        if not text:
            return Response({"error": "Поле 'text' обязательно для заполнения"}, status=status.HTTP_400_BAD_REQUEST)

        new_item = {
            "id": len(_DEMO_MESSAGES) + 1,
            "text": text,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        _DEMO_MESSAGES.append(new_item)
        return Response(new_item, status=status.HTTP_201_CREATED)
