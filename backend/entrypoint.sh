#!/bin/sh
set -e

echo "=== APEX SCHOOL MANAGEMENT SYSTEM CONTAINER STARTUP ==="

# Wait for PostgreSQL if DATABASE_URL is configured
if [ -n "$DATABASE_URL" ] || [ "$USE_POSTGRES" = "True" ] || [ "$USE_POSTGRES" = "true" ] || [ "$USE_POSTGRES" = "1" ]; then
    echo "Waiting for PostgreSQL database to accept connections..."
    python - <<END
import sys
import time
import os

db_url = os.environ.get('DATABASE_URL')
host = os.environ.get('DB_HOST', 'db')
port = int(os.environ.get('DB_PORT', 5432))

if db_url and '@' in db_url:
    try:
        host_part = db_url.split('@')[1].split('/')[0]
        if ':' in host_part:
            host, port = host_part.split(':')
            port = int(port)
        else:
            host = host_part
    except Exception:
        pass

import socket
timeout = 30
start = time.time()
while time.time() - start < timeout:
    try:
        with socket.create_connection((host, port), timeout=2):
            print(f"Database reachable at {host}:{port}")
            sys.exit(0)
    except (socket.timeout, ConnectionRefusedError, socket.gaierror):
        time.sleep(1)

print(f"Timed out connecting to database at {host}:{port}")
sys.exit(1)
END
fi

# Run Database Migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Collect Static Assets
echo "Collecting static files for Nginx reverse proxy..."
python manage.py collectstatic --noinput

# Seed default test users and notifications if running fresh database
if [ "$SEED_DATABASE_ON_STARTUP" = "True" ] || [ "$SEED_DATABASE_ON_STARTUP" = "true" ] || [ "$SEED_DATABASE_ON_STARTUP" = "1" ]; then
    echo "Running database seeding routines..."
    python seed_notifications.py || true
fi

echo "=== Django initialization complete. Starting server process ==="
exec "$@"
