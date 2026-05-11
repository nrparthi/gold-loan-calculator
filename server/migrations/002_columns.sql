-- Additive column migrations — safe on existing databases

ALTER TABLE branches ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'branch';
ALTER TABLE branches ADD COLUMN IF NOT EXISTS storage_path TEXT;

ALTER TABLE loans ADD COLUMN IF NOT EXISTS bank_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS bank_settled_amount DECIMAL(12,2) DEFAULT 0;

ALTER TABLE interest_payments ADD COLUMN IF NOT EXISTS carry_forward DECIMAL(12,2) DEFAULT 0;

ALTER TABLE ornaments_config ADD COLUMN IF NOT EXISTS purity DECIMAL(5,1) DEFAULT 916;
