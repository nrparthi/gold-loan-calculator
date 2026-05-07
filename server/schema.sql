-- Branches table
CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    default_interest_rate DECIMAL DEFAULT 1.5,
    gold_rate DECIMAL DEFAULT 8000,
    silver_rate DECIMAL DEFAULT 100
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    branch_id TEXT REFERENCES branches(id),
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    address TEXT,
    gender TEXT,
    photo TEXT,
    aadhar_photo TEXT
);

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
    id TEXT PRIMARY KEY,
    branch_id TEXT REFERENCES branches(id),
    guardian_name TEXT REFERENCES customers(id),
    loan_date DATE NOT NULL,
    loan_time TIME NOT NULL,
    ornament_category TEXT,
    interest_rate DECIMAL,
    processing_fee DECIMAL,
    payment_mode TEXT,
    bank_name TEXT,
    bank_loan_number TEXT,
    area TEXT,
    loan_amount DECIMAL,
    amount_given DECIMAL,
    ornaments JSONB,
    status TEXT DEFAULT 'active',
    total_interest_paid DECIMAL DEFAULT 0,
    monthly_interest DECIMAL,
    ornament_photo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interest Payments table
CREATE TABLE IF NOT EXISTS interest_payments (
    id SERIAL PRIMARY KEY,
    loan_id TEXT REFERENCES loans(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    amount DECIMAL NOT NULL,
    status TEXT DEFAULT 'pending',
    paid_amount DECIMAL DEFAULT 0,
    payment_date DATE,
    payment_mode TEXT
);

-- Ornaments Config table
CREATE TABLE IF NOT EXISTS ornaments_config (
    id TEXT PRIMARY KEY,
    branch_id TEXT, -- 'admin' or branch uuid
    name TEXT NOT NULL,
    metal_type TEXT NOT NULL
);
