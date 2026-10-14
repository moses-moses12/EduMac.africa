# Apex Academy – Enterprise School Management System (SMS)

A complete, production-grade School Management System built with a decoupled architecture: **Django REST Framework** + **PostgreSQL** + **Celery / Redis** on the backend, and **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS** on the frontend.

Designed with **10 dedicated user roles**, fine-grained role-based access control (RBAC), object-level permissions, and centralized audit logging.

---

## 🌟 10 Core User Roles & Pre-Seeded Accounts
All accounts are seeded with default password: `Password123!`

| Role | Email | Description | Workspace |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@school.edu` | Full system control, accounts, audit trail | `/dashboard/admin` |
| **HEADMASTER** | `headmaster@school.edu` | Principal executive overview & approvals | `/dashboard/headmaster` |
| **ACADEMIC** | `academic@school.edu` | Curriculum, classes, streams & terms | `/dashboard/academic` |
| **TEACHER** | `teacher@school.edu` | Attendance roll call, marks, assignments | `/dashboard/teacher` |
| **STUDENT** | `student@school.edu` | Timetable, results, fees, library loans | `/dashboard/student` |
| **PARENT** | `parent@school.edu` | Children performance, fee statement, payments | `/dashboard/parent` |
| **ACCOUNTANT** | `accountant@school.edu` | Fee structures, bulk invoicing, receipts | `/dashboard/accountant` |
| **LIBRARIAN** | `librarian@school.edu` | Book catalog, loan checkout, return, fines | `/dashboard/librarian` |
| **EXAM_OFFICER** | `exam@school.edu` | Exam sessions, grading curves, report cards | `/dashboard/exam` |
| **STAFF** | `staff@school.edu` | Bulletins, security visitor register | `/dashboard/staff` |

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
python manage.py seed_demo_data
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
*14 comprehensive test cases covering JWT Auth, RBAC permissions, and Service endpoints.*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`
- Features a **1-Click Quick Demo Sign-In** bar to immediately jump into any of the 10 roles!

### 4. Production Docker Deployment
```bash
cd deployment
docker compose up -d --build
```

---

## 🏛️ System Architecture
```
Users (10 Roles)
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
