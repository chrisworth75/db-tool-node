/**
 * Test data fixtures for e2e tests
 * Contains example payment and refund records that will be inserted into test databases
 */

const TEST_CCD = '1234567890123456';
const TEST_PAYMENT_LINK_ID = 9001;
const TEST_FEE_ID = 8001;
const TEST_PAYMENT_ID = 7001;
const TEST_REFUND_ID = 6001;

export const paymentsData = {
    payment_fee_link: {
        id: TEST_PAYMENT_LINK_ID,
        date_created: '2024-01-15 10:00:00',
        date_updated: '2024-01-15 10:00:00',
        payment_reference: 'RC-1234-5678-9012-3456',
        org_id: 'ORG123',
        enterprise_service_name: 'Divorce',
        ccd_case_number: TEST_CCD,
        case_reference: 'CASE-REF-001',
        service_request_callback_url: 'https://example.com/callback'
    },

    fee: {
        id: TEST_FEE_ID,
        code: 'FEE0123',
        version: 1,
        payment_link_id: TEST_PAYMENT_LINK_ID,
        calculated_amount: 550.00,
        volume: 1,
        ccd_case_number: TEST_CCD,
        reference: 'FEE-REF-001',
        net_amount: 550.00,
        fee_amount: 550.00,
        amount_due: 0.00,
        date_created: '2024-01-15 10:00:00',
        date_updated: '2024-01-15 11:30:00'
    },

    payment: {
        id: TEST_PAYMENT_ID,
        amount: 550.00,
        case_reference: 'CASE-REF-001',
        ccd_case_number: TEST_CCD,
        currency: 'GBP',
        date_created: '2024-01-15 11:00:00',
        date_updated: '2024-01-15 11:00:00',
        description: 'Payment for divorce case',
        service_type: 'Divorce',
        site_id: 'AA01',
        user_id: '12345678-1234-1234-1234-123456789012',
        payment_channel: 'online',
        payment_method: 'card',
        payment_provider: 'gov pay',
        payment_status: 'success',
        payment_link_id: TEST_PAYMENT_LINK_ID,
        customer_reference: 'CUST-REF-001',
        external_reference: 'EXT-REF-001',
        organisation_name: 'Example Law Firm',
        pba_number: 'PBA0012345',
        reference: 'RC-1234-5678-9012-3456',
        giro_slip_no: null,
        s2s_service_name: 'divorce_frontend',
        reported_date_offline: null,
        service_callback_url: 'https://example.com/callback',
        document_control_number: 'DCN123456',
        banked_date: '2024-01-16 09:00:00',
        payer_name: 'John Doe',
        internal_reference: 'INT-REF-001'
    },

    fee_pay_apportion: {
        id: 5001,
        payment_id: TEST_PAYMENT_ID,
        fee_id: TEST_FEE_ID,
        payment_link_id: TEST_PAYMENT_LINK_ID,
        fee_amount: 550.00,
        payment_amount: 550.00,
        ccd_case_number: TEST_CCD,
        apportion_type: 'AUTO',
        call_surplus_amount: 0.00,
        created_by: 'system',
        date_created: '2024-01-15 11:00:00',
        date_updated: '2024-01-15 11:00:00',
        apportion_amount: 550.00
    },

    status_history: {
        id: 4001,
        date_created: '2024-01-15 11:00:00',
        date_updated: '2024-01-15 11:00:00',
        external_status: 'success',
        status: 'success',
        payment_id: TEST_PAYMENT_ID,
        error_code: null,
        message: 'Payment successful'
    },

    payment_audit_history: {
        id: 3001,
        ccd_case_no: TEST_CCD,
        audit_type: 'payment_created',
        audit_payload: '{"amount": 550.00}',
        audit_description: 'Payment created successfully',
        date_created: '2024-01-15 11:00:00',
        date_updated: '2024-01-15 11:00:00'
    }
};

export const refundsData = {
    refund: {
        id: TEST_REFUND_ID,
        date_created: '2024-02-01 14:00:00',
        date_updated: '2024-02-01 14:30:00',
        amount: 100.00,
        reason: 'RR037',
        refund_status: 'Approved',
        reference: 'RF-2024-0201-001',
        payment_reference: 'RC-1234-5678-9012-3456',
        created_by: 'refunds.officer@example.com',
        updated_by: 'refunds.approver@example.com',
        ccd_case_number: TEST_CCD,
        fee_ids: String(TEST_FEE_ID),
        notification_sent_flag: 'Y',
        contact_details: '{"email": "john.doe@example.com"}',
        service_type: 'Divorce',
        refund_instruction_type: 'REFUND_TO_SENDER'
    },

    status_history: {
        id: 2001,
        refunds_id: TEST_REFUND_ID,
        status: 'Approved',
        notes: 'Refund approved by approver',
        date_created: '2024-02-01 14:30:00',
        created_by: 'refunds.approver@example.com'
    },

    refund_fee: {
        id: 1001,
        refunds_id: TEST_REFUND_ID,
        fee_id: TEST_FEE_ID,
        code: 'FEE0123',
        version: '1',
        volume: 1,
        refund_amount: 100.00
    }
};

export const expectedOutput = {
    ccdCaseNumber: TEST_CCD,
    paymentReference: 'RC-1234-5678-9012-3456',
    caseReference: 'CASE-REF-001',
    serviceType: 'Divorce',
    organisationName: 'Example Law Firm',

    // Expected counts
    expectedFeeCount: 1,
    expectedPaymentCount: 1,
    expectedRefundCount: 1,
    expectedApportionmentCount: 1,
    expectedRemissionCount: 0,

    // Expected totals
    expectedTotalFees: 550.00,
    expectedTotalPaid: 550.00,
    expectedTotalRefunded: 100.00,
    expectedTotalRemitted: 0.00,
    expectedAmountDue: 0.00,

    // Expected individual amounts
    expectedFeeAmount: 550.00,
    expectedPaymentAmount: 550.00,
    expectedRefundAmount: 100.00
};

export const TEST_CONFIG = {
    TEST_CCD,
    TEST_PAYMENT_LINK_ID,
    TEST_FEE_ID,
    TEST_PAYMENT_ID,
    TEST_REFUND_ID
};
