# EduMax Schools Management System (EduMac.africa)

A unified, production-grade enterprise School Management System (SMS) built with a modern decoupled architecture: **Django REST Framework** + **PostgreSQL** + **Celery / Redis** on the backend, and **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS** on the frontend.

Designed with **9 dedicated user role dashboards**, fine-grained role-based access control (RBAC), object-level permissions, centralized audit logging, interactive financial invoicing & billing, real-time analytics, and an official academic emblem.

---

## 🌟 9 Core User Roles & Pre-Seeded Accounts
All accounts are seeded with default password: `Password123!` (or `moses` for permanent root administrator `moses`).

| Role | Username / Email | Description | Workspace Portal |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` (`admin@school.edu`) | Full system control, accounts, audit trail & configuration | `/dashboard/admin` |
| **HEADMASTER** | `headmaster` (`headmaster@school.edu`) | Principal executive overview, policy & approvals | `/dashboard/headmaster` |
| **ACADEMIC** | `academic` (`academic@school.edu`) | Curriculum, classes, streams, timetables & terms | `/dashboard/academic` |
| **TEACHER** | `teacher` (`teacher@school.edu`) | Attendance roll call, mark entry & student records | `/dashboard/teacher` |
| **STUDENT** | `student` (`student@school.edu`) | Timetable, results, fee statements & library loans | `/dashboard/student` |
| **ACCOUNTANT** | `accountant` (`accountant@school.edu`) | Fee structures, bulk invoicing, receipts & audit | `/dashboard/accountant` |
| **LIBRARIAN** | `librarian` (`librarian@school.edu`) | Book catalog, loan checkout, return & fines | `/dashboard/librarian` |
| **EXAM_OFFICER** | `exam` (`exam@school.edu`) | Exam sessions, grading curves & official transcripts | `/dashboard/exam` |
| **STAFF** | `staff` (`staff@school.edu`) | Front office, security visitor register & gate passes | `/dashboard/staff` |

---

## 🚀 Quickstart Guide

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```
- API Base: `http://127.0.0.1:8000/api/v1/`
- Interactive Swagger UI: `http://127.0.0.1:8000/api/docs/`
- ReDoc: `http://127.0.0.1:8000/api/redoc/`

### 2. Run Automated Pytest Suite
```bash
cd backend
python -m pytest
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`
- Login Page: `http://localhost:3000/login`

### 4. Production Docker Deployment
```bash
cd deployment
docker compose up -d --build
```

---

## 🏛️ System Architecture
```
Users (9 Dedicated Roles)
      │
      ▼
Next.js 16 Frontend (App Router, Tailwind CSS, Lucide, Recharts)
      │  HTTPS / REST / JWT Bearer
      ▼
Django REST Framework API (v1)
      │
      ├─► Auth & RBAC Permissions (Least Privilege, Object Isolation)
      ├─► Service Layer (Fees, Grades, Attendance, Library)
      ├─► Celery Workers & Redis (Async Jobs, Invoicing, Transcripts)
      ├─► Audit Logging Middleware (Immutable Event Log)
      └─► PostgreSQL 16 (28+ Relational Models)
```

---

## 📚 Detailed Documentation
- [System Architecture](docs/ARCHITECTURE.md)
- [REST API Documentation](docs/API_DOCUMENTATION.md)
- [User Roles & Permissions Guide](docs/USER_ROLES_GUIDE.md)
- [Production Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Database Schema Reference](database/schema.sql)
