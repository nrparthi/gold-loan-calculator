-- Performance indexes

CREATE INDEX IF NOT EXISTS idx_loans_branch_id      ON loans(branch_id);
CREATE INDEX IF NOT EXISTS idx_loans_status          ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_created_at      ON loans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loans_branch_status   ON loans(branch_id, status);

CREATE INDEX IF NOT EXISTS idx_interest_loan_id      ON interest_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_interest_status       ON interest_payments(status);
CREATE INDEX IF NOT EXISTS idx_interest_due_date     ON interest_payments(due_date);

CREATE INDEX IF NOT EXISTS idx_part_payments_loan_id ON part_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_part_payments_date    ON part_payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_audit_branch_id       ON audit_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at      ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customers_phone       ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_branch_id   ON customers(branch_id);
