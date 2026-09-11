#!/bin/sh
set -e

# Default BACKEND_URL to the Coolify backend domain
export BACKEND_URL=${BACKEND_URL:-http://api.172.27.61.103.sslip.io}

echo "==> Configuring Nginx with BACKEND_URL=${BACKEND_URL}"
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "==> Starting Nginx..."
exec nginx -g "daemon off;"
