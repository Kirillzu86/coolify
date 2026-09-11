# Базовый Fullstack проект для Coolify (2 Docker-ресурса)

Готовый production-шаблон для быстрого развертывания в **Coolify** в виде двух независимых ресурсов:
- **Resource 1 (Backend)**: Python Django 5 + Django REST Framework + Gunicorn + WhiteNoise
- **Resource 2 (Frontend & Gateway)**: React + TypeScript (Vite) + Nginx Alpine
- **CI/CD**: GitHub Actions (тесты + автодеплой по Webhook Coolify)
- **Целевой сервер**: `172.27.61.103.sslip.io`
- **Протокол**: `HTTP` (настройки Django и Nginx оптимизированы для работы без HTTPS/SSL).

---

## 🏗 Архитектура проекта

```
coolify/
├── .github/
│   └── workflows/
│       └── ci-cd.yml               # GitHub Actions: тесты и вызов вебхуков Coolify
├── backend/                        # РЕСУРС 1 В COOLIFY
│   ├── api/                        # REST API эндпоинты (/api/health/, /api/messages/)
│   ├── core/                       # Настройки Django (settings.py, urls.py, wsgi.py)
│   ├── Dockerfile                  # Python 3.11-slim + Gunicorn + автомиграции
│   ├── entrypoint.sh               # Скрипт запуска (migrate -> collectstatic -> gunicorn)
│   ├── manage.py
│   └── requirements.txt
├── frontend/                       # РЕСУРС 2 В COOLIFY
│   ├── src/                        # Исходный код React + TypeScript
│   ├── Dockerfile                  # Multi-stage: сборка Vite -> Nginx Alpine
│   ├── docker-entrypoint.sh        # Подстановка BACKEND_URL в конфиг Nginx
│   ├── nginx.conf.template         # Шаблон роутинга SPA и проксирования /api/
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml              # Для локального запуска обоих контейнеров
├── .env.example                    # Пример переменных окружения
└── README.md
```

---

## 🚀 Настройка и деплой в Coolify (2 ресурса)

В панели Coolify перейдите в ваш проект и добавьте **2 ресурса (Application)** из одного Git-репозитория.

### Шаг 1: Создание Ресурса 1 (Backend)

1. Нажмите **+ New Resource** -> **Application** -> выберите ваш Git-репозиторий.
2. В настройках ресурса укажите:
   - **Name**: `django-backend`
   - **Base Directory**: `/backend`
   - **Build Pack**: `Dockerfile`
   - **Ports Exposes**: `8000`
   - **Domains**: `http://api.172.27.61.103.sslip.io` *(или оставьте пустым, если обращение идет только через внутреннюю сеть Coolify)*
3. Перейдите во вкладку **Environment Variables** и задайте:
   ```env
   DJANGO_SECRET_KEY=сгенерируйте-сложный-ключ
   DJANGO_DEBUG=False
   DJANGO_ALLOWED_HOSTS=*
   DJANGO_CSRF_TRUSTED_ORIGINS=http://172.27.61.103.sslip.io,http://api.172.27.61.103.sslip.io,http://localhost
   CORS_ALLOW_ALL=True
   ```
   *(Если используете PostgreSQL из Coolify, добавьте переменную `DATABASE_URL`)*.
4. Нажмите **Deploy**.

---

### Шаг 2: Создание Ресурса 2 (Frontend + Nginx)

1. Нажмите **+ New Resource** -> **Application** -> выберите тот же Git-репозиторий.
2. В настройках укажите:
   - **Name**: `react-frontend`
   - **Base Directory**: `/frontend`
   - **Build Pack**: `Dockerfile`
   - **Ports Exposes**: `80`
   - **Domains**: `http://172.27.61.103.sslip.io` *(обязательно укажите именно `http://`, без `https`)*
3. Перейдите во вкладку **Environment Variables** и укажите адрес бэкенда:
   ```env
   BACKEND_URL=http://api.172.27.61.103.sslip.io
   ```
   *(Если бэкенд находится в той же сети Coolify, можно указать внутреннее имя контейнера, например `http://django-backend:8000`)*.
4. Нажмите **Deploy**.

После завершения сборки откройте в браузере:
👉 **`http://172.27.61.103.sslip.io`**

Вы увидите дашборд с активным статусом бэкенда, версиями и возможностью отправки тестовых запросов через API.

---

## 🔄 Настройка CI/CD (GitHub Actions)

В файле `.github/workflows/ci-cd.yml` настроен пайплайн:
1. Линтинг и системный чек Django (`python manage.py check`).
2. Проверка типов и сборка фронтенда (`npm run build`).
3. Автоматический вызов деплоя через Webhook Coolify при пуше в ветку `main`.

### Как настроить автоматический деплой:
1. В панели Coolify в настройках каждого из двух приложений найдите пункт **Deploy Webhook** и скопируйте URL.
2. В вашем GitHub-репозитории откройте **Settings -> Secrets and variables -> Actions** и добавьте два секрета:
   - `COOLIFY_BACKEND_WEBHOOK` — ссылка вебхука бэкенда.
   - `COOLIFY_FRONTEND_WEBHOOK` — ссылка вебхука фронтенда.

Теперь при каждом `git push` в `main` GitHub Actions проверит тесты и автоматически обновит сервисы на сервере.

---

## 💻 Локальный запуск (Docker Compose)

Для проверки всего стека на локальном компьютере:

```bash
# 1. Запустить оба сервиса в Docker
docker compose up --build

# 2. Фронтенд будет доступен по адресу:
http://localhost

# 3. Бэкенд API напрямую доступен по адресу:
http://localhost:8000/api/health/
```

### Локальная разработка без Docker

**Бэкенд:**
```bash
cd backend
python -m venv .venv
# Активация venv (Windows):
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

**Фронтенд:**
```bash
cd frontend
npm install
npm run dev
# Фронтенд откроется на http://localhost:3000 и будет проксировать /api на localhost:8000
```

---

## 🔒 Важные замечания по протоколу HTTP

Поскольку сервер работает по протоколу `http` (`http://172.27.61.103.sslip.io`), в проекте уже предустановлены параметры:
- `SECURE_SSL_REDIRECT = False` — отключено принудительное перенаправление на HTTPS.
- `SESSION_COOKIE_SECURE = False` и `CSRF_COOKIE_SECURE = False` — куки авторизации и CSRF передаются по незашифрованному соединению.
- `CSRF_TRUSTED_ORIGINS` содержит `http://172.27.61.103.sslip.io`, что предотвращает ошибку `403 Forbidden` при выполнении POST/PUT-запросов из React.
