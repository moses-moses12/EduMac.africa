# EduMax School Management System – Architecture Specification

## 1. High-Level Architectural Pattern
The system employs a decoupled, production-grade enterprise architecture:
- **Frontend Layer:** Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query/Axios, Lucide React, and Recharts.
- **API & Business Logic Layer:** Django REST Framework, modular domain apps, service layers, custom permission filters, and OpenAPI 3 schema generation via drf-spectacular.
- **Persistence Layer:** PostgreSQL 16 relational database with UUID primary keys, foreign-key indexing, and check constraints (with SQLite fallback for local test suites).
- **Asynchronous Task Queue:** Celery 5.x backed by Redis 7.x for asynchronous background workflows (e.g., batch invoice generation, PDF report card compilation, notification dispatches).
- **Security & Auditability:** Centralized audit middleware logging every state mutation, JWT token authentication with rotation and blacklisting.

---

## 2. Directory Layout
```
schools system/
├── backend/
│   ├── apps/
│   │   ├── accounts/       # User identity, JWT authentication, 10 RBAC roles
│   │   ├── academics/      # Academic years, terms, classes, streams, subjects
│   │   ├── staff/          # Teachers and non-teaching personnel profiles
│   │   ├── students/       # Student roster, parent links, enrollments
│   │   ├── attendance/     # Daily classroom roll call and status tracking
│   │   ├── examinations/   # Exam sessions, papers, grading rubrics
│   │   ├── results/        # Student exam scores, moderation, transcripts
│   │   ├── fees/           # Fee structures, bulk invoicing, payments, receipts
│   │   ├── library/        # Books catalog, borrowing lifecycle, overdue fines
│   │   ├── timetable/      # Subject and room scheduling
│   │   ├── assignments/    # Teacher coursework, student submissions
│   │   ├── communication/  # Campus bulletins and announcements
│   │   ├── notifications/  # User notification events
│   │   ├── reports/        # Executive telemetry and summaries
│   │   └── audit/          # Immutable chronological audit trail
│   ├── config/             # Django settings, WSGI, ASGI, Celery entry points
│   ├── core/               # Shared permissions, validators, pagination, utils
│   └── tests/              # Pytest test suites (auth, rbac, workflows)
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router (10 role dashboards, login, landing)
│   │   ├── components/     # Reusable layout, navigation, and provider components
│   │   └── lib/            # Axios API client, auth context, TypeScript interfaces
│   └── public/
├── deployment/             # Docker Compose, Dockerfiles, Nginx proxy configs
├── database/               # SQL schema definitions and migrations notes
└── docs/                   # Architectural guides, API specs, role manuals
```

---

## 3. Role-Based Access Control (RBAC) Matrix
The application strictly enforces least-privilege authorization at both viewset and object levels:

| Role | Code | Scope & Privileges |
| :--- | :--- | :--- |
| System Administrator | `ADMIN` | Unrestricted CRUD, User provisioning, Audit trail, System parameters |
| Headmaster / Principal | `HEADMASTER` | Executive KPIs, Tuition collection summaries, Grade approvals |
| Academic Officer | `ACADEMIC` | Curriculum definition, Classes, Streams, Subject catalog |
| Teacher | `TEACHER` | Roll call register, Coursework assignment, Exam mark entries |
| Student | `STUDENT` | Timetable viewing, Results & report cards, Invoices, Book loans |
| Parent / Guardian | `PARENT` | Ward academic progress, Attendance, Fee balance, Online payments |
| Bursar / Accountant | `ACCOUNTANT` | Fee structures, Bulk invoicing, Receipts, Financial ledger |
| Librarian | `LIBRARIAN` | Book cataloging, Issue/return loans, Overdue fine management |
| Examination Officer | `EXAM_OFFICER`| Exam sessions, Scheduling papers, Grading curves, Transcripts |
| Campus Staff | `STAFF` | Announcements publishing, Security visitor register, Inquiries |
