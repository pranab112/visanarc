-- ====================================================================
-- VISA IN ARC - COMPREHENSIVE DATABASE SCHEMA
-- Study Abroad Management System
-- Date: December 26, 2024
-- ====================================================================

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ====================================================================
-- CORE TABLES
-- ====================================================================

-- Agencies table (multi-tenancy support)
CREATE TABLE IF NOT EXISTS agencies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    address TEXT,
    currency TEXT DEFAULT 'NPR',
    subscription_plan TEXT DEFAULT 'Free' CHECK (subscription_plan IN ('Free', 'Pro', 'Enterprise')),
    subscription_expiry_date INTEGER,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'reviewing', 'paid')),
    default_country TEXT DEFAULT 'Australia',
    email_on_visa BOOLEAN DEFAULT 1,
    daily_reminders BOOLEAN DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- Branches table
CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    branch_id TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Owner', 'Counsellor', 'Viewer', 'Student')),
    avatar_url TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'reviewing', 'paid')),
    is_active BOOLEAN DEFAULT 1,
    last_login INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    branch_id TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    target_country TEXT DEFAULT 'Australia',
    status TEXT DEFAULT 'Lead' CHECK (status IN ('Lead', 'Applied', 'Offer Received', 'Visa Granted', 'Visa Rejected', 'Alumni', 'Discontinued')),
    noc_status TEXT DEFAULT 'Not Applied' CHECK (noc_status IN ('Not Applied', 'Applied', 'Voucher Received', 'Verified', 'Issued')),
    notes TEXT,
    portal_password TEXT,
    passport_number TEXT,
    date_of_birth TEXT,
    nationality TEXT,
    address TEXT,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    ocr_confidence REAL,
    highest_qualification TEXT,
    education_history TEXT,
    gpa TEXT,
    test_type TEXT CHECK (test_type IN ('IELTS', 'PTE', 'TOEFL', 'None')),
    test_score TEXT,
    target_score TEXT,
    financial_cap TEXT CHECK (financial_cap IN ('Low', 'Medium', 'Satisfactory', 'High')),
    annual_tuition REAL,
    age INTEGER,
    education_gap INTEGER,
    work_experience INTEGER,
    previous_refusals BOOLEAN DEFAULT 0,
    border_details TEXT,
    intake_month TEXT,
    intake_year TEXT,
    source TEXT,
    referral_partner_id TEXT,
    assigned_partner_id TEXT,
    assigned_partner_name TEXT,
    commission_amount REAL,
    commission_status TEXT DEFAULT 'Pending' CHECK (commission_status IN ('Pending', 'Claimed', 'Received')),
    course_interest TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Partners table
CREATE TABLE IF NOT EXISTS partners (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('University', 'Aggregator', 'College', 'Consultancy', 'B2B Agent')),
    commission_rate REAL DEFAULT 0,
    portal_url TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

-- ====================================================================
-- DOCUMENT MANAGEMENT
-- ====================================================================

-- Student documents tracking
CREATE TABLE IF NOT EXISTS student_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    document_name TEXT NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Uploaded', 'NotRequired')),
    file_key TEXT,
    file_name TEXT,
    file_url TEXT,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_at INTEGER,
    uploaded_by TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Document dependencies
CREATE TABLE IF NOT EXISTS document_dependencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    document_name TEXT NOT NULL,
    depends_on TEXT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ====================================================================
-- NOC MANAGEMENT
-- ====================================================================

-- NOC metadata
CREATE TABLE IF NOT EXISTS noc_metadata (
    student_id TEXT PRIMARY KEY,
    applied_date INTEGER,
    voucher_number TEXT,
    noc_number TEXT,
    approved_date INTEGER,
    notes TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ====================================================================
-- ACADEMIC RECORDS
-- ====================================================================

-- Academic records
CREATE TABLE IF NOT EXISTS academic_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    level TEXT,
    institution TEXT,
    board TEXT,
    passed_year TEXT,
    score TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Test scores
CREATE TABLE IF NOT EXISTS test_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    test_type TEXT,
    listening TEXT,
    reading TEXT,
    writing TEXT,
    speaking TEXT,
    overall TEXT,
    test_date INTEGER,
    is_mock BOOLEAN DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Sponsor records
CREATE TABLE IF NOT EXISTS sponsor_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    name TEXT,
    relationship TEXT,
    occupation TEXT,
    annual_income TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ====================================================================
-- COMMUNICATION
-- ====================================================================

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    text TEXT NOT NULL,
    sender TEXT CHECK (sender IN ('Student', 'Agent')),
    timestamp INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    is_read BOOLEAN DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Student notes
CREATE TABLE IF NOT EXISTS student_notes (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    text TEXT NOT NULL,
    type TEXT DEFAULT 'General' CHECK (type IN ('General', 'Counselling', 'FollowUp', 'Warning', 'Financial')),
    timestamp INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    created_by TEXT,
    is_pinned BOOLEAN DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ====================================================================
-- TEST PREPARATION
-- ====================================================================

-- Test prep enrollment
CREATE TABLE IF NOT EXISTS test_prep_enrollment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL UNIQUE,
    enrolled BOOLEAN DEFAULT 0,
    batch TEXT,
    study_mode TEXT CHECK (study_mode IN ('Physical', 'Online')),
    materials_issued TEXT DEFAULT 'Not Issued' CHECK (materials_issued IN ('Not Issued', 'Issued', 'Partially Issued')),
    instructor_name TEXT,
    enrollment_date INTEGER,
    exam_date INTEGER,
    booking_status TEXT DEFAULT 'Pending' CHECK (booking_status IN ('Pending', 'Booked', 'Completed')),
    portal_username TEXT,
    portal_password TEXT,
    exam_venue TEXT,
    exam_fee_status TEXT DEFAULT 'Unpaid' CHECK (exam_fee_status IN ('Paid', 'Unpaid')),
    fee_status TEXT DEFAULT 'Unpaid' CHECK (fee_status IN ('Paid', 'Unpaid', 'Partial')),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Test prep attendance
CREATE TABLE IF NOT EXISTS test_prep_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT CHECK (status IN ('Present', 'Absent', 'Late')),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE(student_id, date)
);

-- ====================================================================
-- FINANCIAL MANAGEMENT
-- ====================================================================

-- Commission claims
CREATE TABLE IF NOT EXISTS commission_claims (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT,
    partner_id TEXT,
    amount REAL,
    claim_date INTEGER,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Received')),
    notes TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Cancelled')),
    due_date INTEGER,
    paid_date INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    category TEXT CHECK (category IN ('Rent', 'Salaries', 'Marketing', 'Utilities', 'Software', 'Office', 'Travel', 'Other')),
    amount REAL NOT NULL,
    description TEXT,
    date INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

-- Payment receipts
CREATE TABLE IF NOT EXISTS payment_receipts (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    user_id TEXT,
    receipt_data BLOB NOT NULL,
    receipt_type TEXT NOT NULL,
    amount TEXT,
    payment_date INTEGER,
    submission_date INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    student_id TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'NPR',
    type TEXT,
    status TEXT DEFAULT 'Pending',
    reference_number TEXT,
    payment_method TEXT,
    transaction_date INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

-- ====================================================================
-- TASK MANAGEMENT
-- ====================================================================

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date INTEGER,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT DEFAULT 'Todo' CHECK (status IN ('Todo', 'InProgress', 'Done')),
    assigned_to TEXT,
    created_by TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

-- ====================================================================
-- AI/RISK ANALYSIS
-- ====================================================================

-- Risk analysis results
CREATE TABLE IF NOT EXISTS risk_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    analysis_date INTEGER,
    result TEXT,
    risk_score REAL,
    recommendations TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Document audit findings
CREATE TABLE IF NOT EXISTS document_audit_findings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    audit_date INTEGER,
    type TEXT CHECK (type IN ('Critical', 'Warning', 'Verified')),
    category TEXT,
    message TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ====================================================================
-- LEAD MANAGEMENT
-- ====================================================================

-- Lead form configurations
CREATE TABLE IF NOT EXISTS lead_form_configs (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    title TEXT,
    description TEXT,
    fields TEXT, -- JSON string
    is_active BOOLEAN DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agency_id TEXT NOT NULL,
    user_id TEXT,
    action TEXT,
    entity_type TEXT,
    entity_id TEXT,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    timestamp INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- User sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    last_activity INTEGER,
    expires_at INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_students_agency_id ON students(agency_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_target_country ON students(target_country);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at);

CREATE INDEX IF NOT EXISTS idx_users_agency_id ON users(agency_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_chat_messages_student_id ON chat_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

CREATE INDEX IF NOT EXISTS idx_student_documents_student_id ON student_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_status ON student_documents(status);

CREATE INDEX IF NOT EXISTS idx_payment_receipts_agency_id ON payment_receipts(agency_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_status ON payment_receipts(status);

CREATE INDEX IF NOT EXISTS idx_commission_claims_agency_id ON commission_claims(agency_id);
CREATE INDEX IF NOT EXISTS idx_commission_claims_student_id ON commission_claims(student_id);
CREATE INDEX IF NOT EXISTS idx_commission_claims_status ON commission_claims(status);

CREATE INDEX IF NOT EXISTS idx_activity_logs_agency_id ON activity_logs(agency_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);

-- ====================================================================
-- TRIGGERS
-- ====================================================================

-- Update timestamp trigger for students
CREATE TRIGGER IF NOT EXISTS update_students_timestamp
AFTER UPDATE ON students
BEGIN
    UPDATE students SET updated_at = strftime('%s', 'now') * 1000 WHERE id = NEW.id;
END;

-- Update timestamp trigger for users
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = strftime('%s', 'now') * 1000 WHERE id = NEW.id;
END;

-- Update timestamp trigger for agencies
CREATE TRIGGER IF NOT EXISTS update_agencies_timestamp
AFTER UPDATE ON agencies
BEGIN
    UPDATE agencies SET updated_at = strftime('%s', 'now') * 1000 WHERE id = NEW.id;
END;

-- Update agency payment status when receipt is approved
CREATE TRIGGER IF NOT EXISTS update_agency_payment_on_receipt_approval
AFTER UPDATE ON payment_receipts
WHEN NEW.status = 'approved' AND OLD.status != 'approved'
BEGIN
    UPDATE agencies
    SET payment_status = 'paid',
        updated_at = strftime('%s', 'now') * 1000
    WHERE id = NEW.agency_id;
END;

-- ====================================================================
-- INITIAL DATA
-- ====================================================================

-- Insert default agency for demo
INSERT OR IGNORE INTO agencies (id, name, email, payment_status)
VALUES ('local-dev-agency', 'Demo Agency', 'admin@demo.com', 'paid');

-- Insert default branch
INSERT OR IGNORE INTO branches (id, agency_id, name, location)
VALUES ('main', 'local-dev-agency', 'Head Office', 'Main');

-- Insert demo users (password: 'password' - should be hashed in production)
INSERT OR IGNORE INTO users (id, agency_id, name, email, password_hash, role)
VALUES
    ('mock-admin-id', 'local-dev-agency', 'System Administrator', 'admin@demo.com', 'password', 'Owner'),
    ('mock-staff-id', 'local-dev-agency', 'Lead Counsellor', 'staff@demo.com', 'password', 'Counsellor'),
    ('1', 'local-dev-agency', 'Ram Karki', 'student@demo.com', 'password', 'Student');

-- ====================================================================
-- VERIFICATION
-- ====================================================================

SELECT 'Database schema created successfully!' as status;
SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table';
SELECT COUNT(*) as index_count FROM sqlite_master WHERE type='index';
SELECT COUNT(*) as trigger_count FROM sqlite_master WHERE type='trigger';