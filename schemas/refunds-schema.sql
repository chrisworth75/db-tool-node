-- Generated from ccpay-refunds-app liquibase changelogs
-- Date: 2025-11-14
-- Source: /Users/chris/dev-feepay/ccpay-refunds-app/src/main/resources/db/changelog/

-- ============================================================
-- Table: refunds
-- Main refunds table
-- ============================================================
CREATE TABLE refunds (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date_created TIMESTAMP WITHOUT TIME ZONE,
    date_updated TIMESTAMP WITHOUT TIME ZONE,
    amount NUMERIC(19, 2),
    reason VARCHAR(255),
    refund_status VARCHAR(255),
    reference VARCHAR(255),
    payment_reference VARCHAR(255),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    ccd_case_number VARCHAR(255),
    fee_ids VARCHAR(255),
    notification_sent_flag VARCHAR(255),
    contact_details JSON,
    service_type VARCHAR(100),
    refund_instruction_type VARCHAR(255)
);

-- ============================================================
-- Table: status_history
-- Tracks status changes for refunds
-- ============================================================
CREATE TABLE status_history (
    id INT(4) PRIMARY KEY AUTO_INCREMENT,
    refunds_id INT(4) NOT NULL,
    status VARCHAR(255),
    notes VARCHAR(255),
    date_created TIMESTAMP WITHOUT TIME ZONE,
    created_by VARCHAR(255),
    CONSTRAINT FK_1000021 FOREIGN KEY (refunds_id) REFERENCES refunds(id)
);

-- ============================================================
-- Table: refund_reasons
-- Lookup table for refund reason codes
-- ============================================================
CREATE TABLE refund_reasons (
    code VARCHAR(5) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    recently_used BOOLEAN DEFAULT FALSE
);

-- Insert refund reasons data
INSERT INTO refund_reasons (code, name, description, recently_used) VALUES
    ('RR001', 'Amended claim', 'The claim is amended', TRUE),
    ('RR002', 'Amended court', 'The court is amended', FALSE),
    ('RR003', 'Application rejected', 'The application is rejected', TRUE),
    ('RR004', 'Application/case withdrawn', 'The case is withdrawn', TRUE),
    ('RR005', 'Claim issued in error (court error)', 'Claim Issued in error (court error)', FALSE),
    ('RR006', 'Claim issued in error (customer error)', 'Claim Issued in error (customer error)', FALSE),
    ('RR007', 'Court discretion', 'Court discretion', TRUE),
    ('RR008', 'Court error', 'Due to some error in court', FALSE),
    ('RR009', 'Duplicate fee (court error)', 'Fee got duplicated due to court error', TRUE),
    ('RR010', 'Duplicate fee (customer error)', 'Fee got duplicated due to customer error', TRUE),
    ('RR011', 'Excess fee paid', 'Excess fee paid', FALSE),
    ('RR012', 'Following appeal', 'Following appeal', FALSE),
    ('RR014', 'Incorrect fee taken/wrong fee selected', 'Incorrect fee taken/Wrong Fee Selected', FALSE),
    ('RR015', 'Incorrect PBA reference supplied', 'Incorrect PBA reference supplied', FALSE),
    ('RR016', 'Judge''s order', 'Judge''s order', FALSE),
    ('RR017', 'Missing/incorrect documents', 'Missing/Incorrect Documents', FALSE),
    ('RR019', 'Return of hearing fee', 'Return of hearing fee', FALSE),
    ('RR020', 'Trial fees (on settlements)', 'Trial fees (on settlements)', FALSE),
    ('RR021', 'Unused warrant', 'Unused warrant', FALSE),
    ('RR022', 'Unpaid cheque', 'Unpaid cheque', FALSE),
    ('RR023', 'Fee not due', 'Fee not due (court error)', TRUE),
    ('RR024', 'System/technical error', 'System error / Technical error', TRUE),
    ('RR025', 'Legal correction - legislation revised', 'Legal correction - Legislation Revised', FALSE),
    ('RR026', 'Legal correction - legislation reinterpretation', 'Legal correction - Legislation Reinterpretation', FALSE),
    ('RR027', 'Other - RCJ', 'Other - RCJ', FALSE),
    ('RR028', 'Other - County', 'Other - County', FALSE),
    ('RR029', 'Other - Divorce', 'Other - Divorce', FALSE),
    ('RR030', 'Other - Probate', 'Other - Probate', FALSE),
    ('RR031', 'Other - Private Law', 'Other - Private Law', FALSE),
    ('RR032', 'Other - Public Law', 'Other - Public Law', FALSE),
    ('RR033', 'Other - Family', 'Other - Family', FALSE),
    ('RR034', 'Other - CoP', 'Other - CoP', FALSE),
    ('RR035', 'Other - Tribunals', 'Other - Tribunals', FALSE),
    ('RR036', 'Retrospective remission', 'Retrospective remission', FALSE),
    ('RR037', 'Overpayment', 'Refund for Overpayment', FALSE);

-- Note: RR013 and RR018 were deleted in changeset 100007-2

-- ============================================================
-- Table: refund_status
-- Lookup table for refund status values
-- ============================================================
CREATE TABLE refund_status (
    name VARCHAR(255) PRIMARY KEY,
    description VARCHAR(1000)
);

-- Insert refund status data
INSERT INTO refund_status (name, description) VALUES
    ('Sent for approval', 'Refund request submitted'),
    ('Approved', 'Refund request sent to middle office'),
    ('Update required', 'Refund request sent back'),
    ('Accepted', 'Refund request accepted'),
    ('Rejected', 'Refund request rejected'),
    ('Cancelled', 'Refund request cancelled');

-- ============================================================
-- Table: rejection_reasons
-- Lookup table for rejection reason codes
-- ============================================================
CREATE TABLE rejection_reasons (
    code VARCHAR(5) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255)
);

-- Insert rejection reasons data
INSERT INTO rejection_reasons (code, name, description) VALUES
    ('RE001', 'No associated payment', 'No associated payment for the refund.'),
    ('RE002', 'Already refunded', 'The amount is Already refunded'),
    ('RE003', 'The case details don''t match the help with fees details', 'The case details don''t match the help with fees details'),
    ('RE004', 'More evidence is required', 'More evidence is required to process the refund.'),
    ('RE005', 'Other', 'Other');

-- ============================================================
-- Table: refund_fees
-- Maps fees to refunds (many-to-many relationship)
-- ============================================================
CREATE TABLE refund_fees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    refunds_id INT NOT NULL,
    fee_id INT NOT NULL,
    code VARCHAR(255),
    version VARCHAR(255),
    volume INT,
    refund_amount NUMERIC(19, 2),
    CONSTRAINT fk_refunds_id FOREIGN KEY (refunds_id) REFERENCES refunds(id)
);

-- ============================================================
-- Foreign Key Constraints
-- ============================================================
ALTER TABLE refunds
    ADD CONSTRAINT FK_1000081
    FOREIGN KEY (refund_status)
    REFERENCES refund_status(name)
    ON UPDATE CASCADE;

-- ============================================================
-- Indexes
-- (Add indexes as needed for performance)
-- ============================================================
-- CREATE INDEX idx_refunds_status ON refunds(refund_status);
-- CREATE INDEX idx_refunds_payment_ref ON refunds(payment_reference);
-- CREATE INDEX idx_refunds_ccd_case ON refunds(ccd_case_number);
-- CREATE INDEX idx_status_history_refunds_id ON status_history(refunds_id);
-- CREATE INDEX idx_refund_fees_refunds_id ON refund_fees(refunds_id);
