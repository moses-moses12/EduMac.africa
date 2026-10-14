# Apex Academy SMS – Production Deployment Guide

## 1. Prerequisites
- Docker & Docker Compose v2.20+
- Minimum Server Specs: 4 vCPUs, 8 GB RAM, 50 GB SSD storage
- Domain Name with SSL Certificate (e.g., Let's Encrypt / Certbot)

---

## 2. Fast-Track Deployment (Docker Compose)
Clone the repository and enter the deployment directory:
```bash
git clone <repo_url>
cd "schools system"
```

Copy the environment sample and configure production secrets:
```bash
cp backend/.env.example backend/.env
```

Review critical parameters in `backend/.env`:
```ini
DJANGO_SECRET_KEY=production_cryptographically_secure_random_key_here
DEBUG=False
ALLOWED_HOSTS=sms.school.edu,localhost,127.0.0.1
DATABASE_URL=postgresql://sms_user:sms_secure_password_2026@db:5432/school_management_db
CELERY_BROKER_URL=redis://redis:6379/1
CORS_ALLOWED_ORIGINS=https://sms.school.edu
```

Launch the entire containerized fleet:
```bash
cd deployment
docker compose up -d --build
```

---

## 3. Database Initialization & Demo Seeding
Execute database migrations inside the running backend container:
```bash
docker compose exec backend python manage.py migrate
```

Populate the database with all 10 user roles and operational demonstration records:
```bash
docker compose exec backend python manage.py seed_demo_data
```

Collect static assets for Nginx serving:
```bash
docker compose exec backend python manage.py collectstatic --noinput
```

---

## 4. Verification & Health Checks
Verify running containers:
```bash
docker compose ps
```
The following containers should report `Up (healthy)`:
- `sms_postgres` (Port 5432)
- `sms_redis` (Port 6379)
- `sms_backend` (Gunicorn / Port 8000)
- `sms_celery_worker` (Background jobs)
- `sms_celery_beat` (Scheduled jobs)
- `sms_frontend` (Next.js / Port 3000)
- `sms_nginx_proxy` (Port 80 / 443)

Navigate to `http://localhost/` or your configured domain to access the system.
Navigate to `http://localhost/api/docs/` for interactive Swagger API documentation.
