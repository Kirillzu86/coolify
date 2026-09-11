#!/bin/sh
set -e

# Default BACKEND_URL if not provided in Coolify / Docker
export BACKEND_URL=${BACKEND_URL:-http://backend:8000}

echo "==> Configuring Nginx with BACKEND_URL=${BACKEND_URL}"
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "==> Starting Nginx..."
exec nginx -g "daemon off;"
