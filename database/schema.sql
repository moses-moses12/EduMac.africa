-- Enterprise School Management System
-- Schema Architecture Reference
-- Database: PostgreSQL 16+

-- 1. Accounts & Core User RBAC
-- Table: accounts_user
-- Fields: id (UUID), email (VARCHAR, UNIQUE), password (VARCHAR), role (VARCHAR), first_name, last_name, is_active, date_joined

-- 2. Academics Hierarchy
-- Table: academics_academicyear (id, name, start_date, end_date, is_current)
-- Table: academics_term (id, name, academic_year_id, start_date, end_date, is_current)
-- Table: academics_class (id, name, code, order)
-- Table: academics_stream (id, name, class_obj_id)
-- Table: academics_subject (id, name, code, is_core)

-- 3. Staff & Faculty
-- Table: staff_staff (id, user_id, department, designation, employee_id, joining_date, is_active)
-- Table: staff_teacher (id, user_id, employee_id, designation, qualification, specialization, joining_date, is_active)

-- 4. Students & Guardians
-- Table: students_parent (id, user_id, occupation, address, emergency_contact)
-- Table: students_student (id, user_id, admission_number, current_class_id, stream_id, parent_id, date_of_birth, gender, admission_date, is_active)
-- Table: students_studentenrollment (id, student_id, academic_year_id, class_obj_id, stream_id, enrolled_date, is_active)

-- 5. Daily Attendance
-- Table: attendance_attendance (id, student_id, class_obj_id, date, status, remarks, recorded_by_id)

-- 6. Examinations & Results
-- Table: examinations_grade (id, letter, min_score, max_score, grade_point, remarks)
-- Table: examinations_examination (id, name, academic_year_id, term_id, start_date, end_date, is_published)
-- Table: examinations_examinationsubject (id, examination_id, subject_id, max_score, passing_score, exam_date)
-- Table: results_result (id, student_id, examination_subject_id, score, grade_id, remarks)

-- 7. Bursar Billing & Fees
-- Table: fees_feestructure (id, name, academic_year_id, term_id, class_obj_id, total_amount, due_date)
-- Table: fees_feeitem (id, fee_structure_id, name, amount, is_mandatory)
-- Table: fees_invoice (id, invoice_number, student_id, fee_structure_id, total_amount, paid_amount, balance, status, due_date)
-- Table: fees_payment (id, invoice_id, amount, payment_method, transaction_reference, payment_date, received_by_id)
-- Table: fees_receipt (id, receipt_number, payment_id, issued_date)

-- 8. Library Catalog & Circulations
-- Table: library_bookcategory (id, name, description)
-- Table: library_book (id, title, isbn, author, category_id, total_copies, available_copies)
-- Table: library_bookloan (id, book_id, student_id, staff_id, loan_date, due_date, return_date, status, fine_amount)

-- 9. Communications, Notifications & Audit Log
-- Table: communication_announcement (id, title, content, priority, target_audience, author_id, created_at)
-- Table: notifications_notification (id, recipient_id, title, message, notification_type, is_read, created_at)
-- Table: audit_auditlog (id, user_id, action, model_name, object_id, changes, ip_address, timestamp)
