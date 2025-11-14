
-- Schema for payment_fee_link
CREATE TABLE payment_fee_link (
    id BIGINT PRIMARY KEY,
    date_created TIMESTAMP NOT NULL,
    date_updated TIMESTAMP NOT NULL,
    payment_reference VARCHAR(50) NOT NULL,
    org_id VARCHAR(20),
    enterprise_service_name VARCHAR(255),
    ccd_case_number VARCHAR(25) NOT NULL,
    case_reference VARCHAR(25),
    service_request_callback_url TEXT
);

-- Schema for fee
CREATE TABLE fee (
    id BIGINT PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    version INT NOT NULL,
    payment_link_id BIGINT NOT NULL REFERENCES payment_fee_link(id),
    calculated_amount NUMERIC(12,2) NOT NULL,
    volume INT NOT NULL,
    ccd_case_number VARCHAR(25) NOT NULL,
    reference VARCHAR(50),
    net_amount NUMERIC(12,2) NOT NULL,
    fee_amount NUMERIC(12,2) NOT NULL,
    amount_due NUMERIC(12,2) NOT NULL,
    date_created TIMESTAMP NOT NULL,
    date_updated TIMESTAMP NOT NULL
);

-- Schema for payment
CREATE TABLE payment (
    id BIGINT PRIMARY KEY,
    amount NUMERIC(12,2) NOT NULL,
    case_reference VARCHAR(25),
    ccd_case_number VARCHAR(25) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    date_created TIMESTAMP NOT NULL,
    date_updated TIMESTAMP NOT NULL,
    description TEXT,
    service_type VARCHAR(255),
    site_id VARCHAR(20),
    user_id UUID,
    payment_channel VARCHAR(50),
    payment_method VARCHAR(50),
    payment_provider VARCHAR(50),
    payment_status VARCHAR(20),
    payment_link_id BIGINT NOT NULL REFERENCES payment_fee_link(id),
    customer_reference VARCHAR(50),
    external_reference VARCHAR(50),
    organisation_name VARCHAR(255),
    pba_number VARCHAR(50),
    reference VARCHAR(50) NOT NULL,
    giro_slip_no VARCHAR(50),
    s2s_service_name VARCHAR(50),
    reported_date_offline TIMESTAMP,
    service_callback_url TEXT,
    document_control_number VARCHAR(50),
    banked_date TIMESTAMP,
    payer_name VARCHAR(255),
    internal_reference VARCHAR(50)
);

-- Schema for fee_pay_apportion
CREATE TABLE fee_pay_apportion (
    id BIGINT PRIMARY KEY,
    payment_id BIGINT NOT NULL REFERENCES payment(id),
    fee_id BIGINT NOT NULL REFERENCES fee(id),
    payment_link_id BIGINT NOT NULL REFERENCES payment_fee_link(id),
    fee_amount NUMERIC(12,2) NOT NULL,
    payment_amount NUMERIC(12,2) NOT NULL,
    ccd_case_number VARCHAR(25) NOT NULL,
    apportion_type VARCHAR(50),
    call_surplus_amount NUMERIC(12,2),
    created_by VARCHAR(50),
    date_created TIMESTAMP NOT NULL,
    date_updated TIMESTAMP NOT NULL,
    apportion_amount NUMERIC(12,2)
);

-- Schema for remission
CREATE TABLE remission (
    id BIGINT PRIMARY KEY,
    hwf_reference VARCHAR(50),
    hwf_amount NUMERIC(12,2) NOT NULL,
    beneficiary_name VARCHAR(255),
    ccd_case_number VARCHAR(25) NOT NULL,
    case_reference VARCHAR(25),
    remission_reference VARCHAR(50),
    site_id VARCHAR(50),
    payment_link_id BIGINT NOT NULL REFERENCES payment_fee_link(id),
    date_created TIMESTAMP NOT NULL,
    date_updated TIMESTAMP NOT NULL,
    fee_id BIGINT NOT NULL REFERENCES fee(id)
);

-- Schema for status_history
CREATE TABLE status_history (
    id BIGINT PRIMARY KEY,
    date_created TIMESTAMP NOT NULL,
    date_updated TIMESTAMP NOT NULL,
    external_status VARCHAR(50),
    status VARCHAR(50),
    payment_id BIGINT NOT NULL REFERENCES payment(id),
    error_code VARCHAR(50),
    message TEXT
);

-- Schema for payment_audit_history
CREATE TABLE payment_audit_history (
    id BIGINT PRIMARY KEY,
    ccd_case_no VARCHAR(25) NOT NULL,
    audit_type VARCHAR(50),
    audit_payload TEXT,
    audit_description TEXT,
    date_created TIMESTAMP NOT NULL,
    date_updated TIMESTAMP NOT NULL
);
