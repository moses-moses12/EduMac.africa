# Docker Deployment & Orchestration Guide

This project includes complete, containerized infrastructure for the **EduMax School Management System** using Docker, Docker Compose, PostgreSQL 16, Redis 7, Celery, Gunicorn, Next.js 16, and Nginx.

---

## Architecture Overview

```
                      ┌──────────────────────┐
                      │    Client Browser    │
                      └──────────┬───────────┘
                                 │ :80
                      ┌──────────▼───────────┐
                      │     Nginx Proxy      │
                      │  (gzip, websockets)  │
                      └────┬────────────┬────┘
                           │            │
            /api, /admin   │            │ /
        ┌──────────────────▼──┐      ┌──▼──────────────────┐
        │   Django Backend    │      │  Next.js Frontend   │
        │(Gunicorn, Python3.12│      │  (Node.js 20 Alpine)│
        └───────┬───────┬─────┘      └─────────────────────┘
                │       │
                │       └──────────┐
        ┌───────▼──────┐    ┌──────▼──────┐
        │  PostgreSQL  │    │ Redis Cache │
        │ (Database 16)│    │& Celery Brok│
        └──────────────┘    └──────┬──────┘
                                   │
                           ┌───────▼────────┐
                           │ Celery Workers │
                           │(Worker & Beat) │
                           └────────────────┘
```

---

## File Structure

```
├── docker-compose.yml           # Production Docker Compose orchestration
├── docker-compose.dev.yml       # Development override with live code mounting
├── .env.example                 # Environment variables template
├── .dockerignore                # Root Docker ignore rules
├── DOCKER.md                    # This deployment guide
│
├── backend/
│   ├── Dockerfile               # Multi-worker Gunicorn production image
│   ├── Dockerfile.dev           # Hot-reloading development image
│   ├── entrypoint.sh            # Automated DB wait, migrate, & collectstatic
│   ├── .dockerignore            # Python/Django ignore rules
│   └── requirements.txt         # Pinned backend dependencies
│
├── frontend/
│   ├── Dockerfile               # Multi-stage Next.js production build
│   ├── Dockerfile.dev           # Next.js hot-reloading development image
│   └── .dockerignore            # Node.js/Next.js ignore rules
│
└── deployment/
    ├── nginx.conf               # Nginx reverse proxy with WebSocket & asset caching
    ├── docker-compose.yml       # Secondary compose configuration
    ├── Dockerfile.backend       # Mirror backend image
    └── Dockerfile.frontend      # Mirror frontend image
```

---

## Quick Start (Production)

### 1. Copy Environment Variables
```bash
cp .env.example .env
```

### 2. Build and Launch Containers
```bash
docker compose up --build -d
```

### 3. Access Services
- **Web Application**: [http://localhost](http://localhost) (via Nginx Port 80)
- **API Documentation (Swagger)**: [http://localhost/api/docs/](http://localhost/api/docs/)
- **Django Administration**: [http://localhost/admin/](http://localhost/admin/)
- **Frontend Direct**: [http://localhost:3000](http://localhost:3000)
- **Backend Direct**: [http://localhost:8000](http://localhost:8000)

---

## Development Mode (Live Code Reloading)

To run with live source-code mounting and hot reload:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

---

## Helpful Commands

### View Service Logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

### Run Django Migrations Manually
```bash
docker compose exec backend python manage.py migrate
```

### Create Superuser
```bash
docker compose exec backend python manage.py createsuperuser
```

### Run Test Suite
```bash
docker compose exec backend pytest
```

### Stop All Containers
```bash
docker compose down
```

### Stop and Wipe Volumes (Fresh Reset)
```bash
docker compose down -v
```
