# Apex Academy SMS – REST API Endpoint Reference

## Base URL
- Production: `https://sms.school.edu/api/v1`
- Local Development: `http://127.0.0.1:8000/api/v1`
- Swagger UI Documentation: `http://127.0.0.1:8000/api/docs/`
- ReDoc Documentation: `http://127.0.0.1:8000/api/redoc/`
- OpenAPI 3 JSON Schema: `http://127.0.0.1:8000/api/schema/`

---

## 1. Authentication Endpoints (`/auth/`)
All protected endpoints require an `Authorization: Bearer <access_token>` header.

### `POST /auth/login/`
Authenticates a user and issues access + refresh JWT tokens with role context.
**Request:**
```json
{
  "email": "admin@school.edu",
  "password": "Password123!"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Welcome back, Sarah!",
  "data": {
    "user": {
      "id": "e4f8d5...",
      "email": "admin@school.edu",
      "first_name": "Sarah",
      "last_name": "Connor",
      "role": "ADMIN",
      "is_active": true
    },
    "tokens": {
      "access": "eyJhbGciOi...",
      "refresh": "eyJhbGciOi..."
    }
  }
}
```

### `POST /auth/refresh/`
Refreshes an expired access token using a valid refresh token.
**Request:**
```json
{
  "refresh": "eyJhbGciOi..."
}
```
**Response (200 OK):**
```json
{
  "access": "eyJhbGciOi..."
}
```

### `GET /auth/me/`
Returns current authenticated user details.
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "e4f8d5...",
    "email": "admin@school.edu",
    "role": "ADMIN"
  }
}
```

---

## 2. Academics & Curriculum Endpoints
- `GET /api/v1/academics/years/` - List academic years
- `GET /api/v1/academics/terms/` - List terms within academic years
- `GET /api/v1/academics/classes/` - List class levels (Form 1 - Form 4)
- `GET /api/v1/academics/streams/` - List class streams (East, West, North)
- `GET /api/v1/academics/subjects/` - Subject catalog

---

## 3. Fees & Financial Endpoints
- `GET /api/v1/fees/structures/` - Fee structure templates per class and term
- `GET /api/v1/fees/invoices/` - Invoices ledger (role filtered: Students only see own invoices)
- `POST /api/v1/fees/invoices/generate_bulk/` - Batch generate invoices for class students
- `GET /api/v1/fees/invoices/financial_summary/` - High-level collection KPIs (total billed, collected, balance)
- `POST /api/v1/fees/payments/` - Record remittance and generate official receipt

---

## 4. Attendance & Roll Call Module
- `GET /api/v1/attendance/records/` - Attendance history filtered by date range, student, stream, status, attendance_type, subject
- `POST /api/v1/attendance/records/` - Record single attendance event (Status: `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`)
- `POST /api/v1/attendance/records/bulk_mark/` - Batch record daily roll call or subject attendance:
  - Payload: `{ date, stream_id, attendance_type: 'DAILY' | 'SUBJECT', subject_id, records: [{ student_id, status, notes }] }`
- `GET /api/v1/attendance/records/summary/` - Live attendance counts (present, absent, late, excused) and percentage rate
- `GET /api/v1/attendance/records/monthly_summary/` - Monthly aggregate rates and breakdown by year/month
- `GET /api/v1/attendance/records/reports/` - Comprehensive class attendance reports, student breakdowns, and chronic absenteeism list (< 75% rate)
- `GET /api/v1/attendance/me/` - Self-service attendance endpoint:
  - Students see ONLY their own records, percentage, and monthly summaries
  - Parents see records for linked children with child selector support

---

## 5. Examination Module & Result Lifecycle System
- `GET /api/v1/examinations/sessions/` - Exam sessions (Mid-Term, Final, CAT, Mock, Quiz) with schedule periods and status
- `POST /api/v1/examinations/sessions/{id}/publish/` - Exam Officer / Admin publish exam session and its approved results
- `GET /api/v1/examinations/subjects/` - Exam papers roster, schedules, timing, rooms, max marks, and pass marks
- `GET /api/v1/examinations/subjects/{id}/candidates/` - Enrolled student candidate roster with marks status
- `GET /api/v1/examinations/grades/` - Configurable institutional grading rules scale:
  - `80.00 – 100.00% = A` (4.00 GPA, Distinction)
  - `70.00 – 79.99%  = B` (3.00 GPA, Very Good)
  - `60.00 – 69.99%  = C` (2.00 GPA, Good / Satisfactory)
  - `50.00 – 59.99%  = D` (1.00 GPA, Pass)
  - `40.00 – 49.99%  = E` (0.50 GPA, Marginal Pass)
  - `0.00 – 39.99%   = F` (0.00 GPA, Fail / Needs Improvement)
  *(Backend is the single source of truth for grading calculation)*
- `GET /api/v1/results/scores/` - Filterable mark entries. **Security Rule:** Students and parents can strictly only see `PUBLISHED` results
- `POST /api/v1/results/scores/bulk_entry/` - Teachers / Exam Officers enter marks in batch with validation against `max_marks` (auto-calculates Grade and Percentage)
- `POST /api/v1/results/scores/workflow_transition/` - 5-stage lifecycle state engine:
  - Lifecycle: `DRAFT` → `SUBMITTED` → `VERIFIED` → `APPROVED` → `PUBLISHED`
  - Actions: `submit`, `verify`, `approve`, `publish`, `revert`
- `GET /api/v1/results/scores/report_card/?student_id=&examination_id=` - Full official report card with total, average, GPA, and subject breakdown
- `GET /api/v1/results/me/` - Student & Parent self-service results:
  - Strictly returns `PUBLISHED` results only
  - Includes Subject, Marks, Max marks, Percentage, Grade, Total score, Average, and Performance summary

---

## 6. Library Resource Center
- `GET /api/v1/library/books/` - Searchable catalog of books and available copies
- `GET /api/v1/library/loans/` - Active and historic borrowing records
- `POST /api/v1/library/loans/` - Check out book to student or faculty
- `POST /api/v1/library/loans/{id}/return_book/` - Mark book as returned and assess fines

---

## 7. Audit & Security Trail
- `GET /api/v1/audit/logs/` - Immutable chronological audit trail (Restricted to `ADMIN` only)
