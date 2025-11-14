import { transformToCase } from './caseTransformer.js';
import { Case, ServiceRequest, Fee, Payment, Refund } from '../models/Case.js';

describe('transformToCase', () => {
    it('should transform database data to Case DTO with single SR', () => {
        const paymentData = {
            payment_fee_links: [
                {
                    id: 1,
                    ccd_case_number: '12345',
                    payment_reference: 'RC-001',
                    case_reference: 'CASE-001',
                    date_created: '2024-01-01',
                    date_updated: '2024-01-01',
                    org_id: 'ORG1',
                    enterprise_service_name: 'Divorce'
                }
            ],
            fees: [
                {
                    id: 1,
                    payment_link_id: 1,
                    ccd_case_number: '12345',
                    code: 'FEE001',
                    version: 1,
                    fee_amount: '550.00',
                    calculated_amount: '550.00',
                    net_amount: '550.00',
                    amount_due: '550.00',
                    volume: 1
                }
            ],
            payments: [
                {
                    id: 1,
                    payment_link_id: 1,
                    ccd_case_number: '12345',
                    reference: 'RC-001',
                    amount: '550.00',
                    currency: 'GBP',
                    payment_status: 'Success',
                    payment_method: 'card'
                }
            ],
            apportionments: [],
            remissions: [],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [],
            refund_status_history: [],
            refund_fees: []
        };

        const result = transformToCase(paymentData, refundData);

        expect(result).toBeInstanceOf(Case);
        expect(result.ccdCaseNumber).toBe('12345');
        expect(result.serviceRequests).toHaveLength(1);
        expect(result.serviceRequests[0]).toBeInstanceOf(ServiceRequest);
        expect(result.serviceRequests[0].fees).toHaveLength(1);
        expect(result.serviceRequests[0].fees[0]).toBeInstanceOf(Fee);
        expect(result.serviceRequests[0].payments).toHaveLength(1);
        expect(result.serviceRequests[0].payments[0]).toBeInstanceOf(Payment);
    });

    it('should attach refunds to correct payments', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: '12345', payment_reference: 'RC-001' }
            ],
            fees: [
                { id: 1, payment_link_id: 1, ccd_case_number: '12345', code: 'FEE001', version: 1, fee_amount: '100' }
            ],
            payments: [
                {
                    id: 1,
                    payment_link_id: 1,
                    ccd_case_number: '12345',
                    reference: 'RC-001',
                    amount: '100.00'
                }
            ],
            apportionments: [],
            remissions: [],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [
                {
                    id: 1,
                    ccd_case_number: '12345',
                    payment_reference: 'RC-001',
                    reference: 'RF-001',
                    amount: '50.00',
                    reason: 'RR001',
                    refund_status: 'Approved'
                }
            ],
            refund_status_history: [],
            refund_fees: []
        };

        const result = transformToCase(paymentData, refundData);

        expect(result.serviceRequests[0].payments[0].refunds).toHaveLength(1);
        expect(result.serviceRequests[0].payments[0].refunds[0]).toBeInstanceOf(Refund);
        expect(result.serviceRequests[0].payments[0].refunds[0].amount).toBe('50.00');
        expect(result.serviceRequests[0].payments[0].refunds[0].paymentReference).toBe('RC-001');
    });

    it('should attach remissions to fees', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: '12345', payment_reference: 'RC-001' }
            ],
            fees: [
                {
                    id: 1,
                    payment_link_id: 1,
                    ccd_case_number: '12345',
                    code: 'FEE001',
                    version: 1,
                    fee_amount: '550.00'
                }
            ],
            payments: [],
            apportionments: [],
            remissions: [
                {
                    id: 1,
                    payment_link_id: 1,
                    fee_id: 1,
                    hwf_reference: 'HWF-001',
                    hwf_amount: '275.00',
                    beneficiary_name: 'John Doe'
                }
            ],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [],
            refund_status_history: [],
            refund_fees: []
        };

        const result = transformToCase(paymentData, refundData);

        expect(result.serviceRequests[0].fees[0].remissions).toHaveLength(1);
        expect(result.serviceRequests[0].fees[0].remissions[0].hwfReference).toBe('HWF-001');
        expect(result.serviceRequests[0].fees[0].remissions[0].amount).toBe('275.00');
    });

    it('should return array of cases when multiple CCDs found', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: 'CCD1', payment_reference: 'RC-001' },
                { id: 2, ccd_case_number: 'CCD2', payment_reference: 'RC-002' }
            ],
            fees: [
                { id: 1, payment_link_id: 1, ccd_case_number: 'CCD1', code: 'FEE001', version: 1, fee_amount: '100' },
                { id: 2, payment_link_id: 2, ccd_case_number: 'CCD2', code: 'FEE002', version: 1, fee_amount: '200' }
            ],
            payments: [],
            apportionments: [],
            remissions: [],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [],
            refund_status_history: [],
            refund_fees: []
        };

        const result = transformToCase(paymentData, refundData);

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(2);
        expect(result[0].ccdCaseNumber).toBe('CCD1');
        expect(result[1].ccdCaseNumber).toBe('CCD2');
    });

    it('should handle multiple SRs for same CCD', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: '12345', payment_reference: 'RC-001' },
                { id: 2, ccd_case_number: '12345', payment_reference: 'RC-002' }
            ],
            fees: [
                { id: 1, payment_link_id: 1, ccd_case_number: '12345', code: 'FEE001', version: 1, fee_amount: '100' },
                { id: 2, payment_link_id: 2, ccd_case_number: '12345', code: 'FEE002', version: 1, fee_amount: '200' }
            ],
            payments: [],
            apportionments: [],
            remissions: [],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [],
            refund_status_history: [],
            refund_fees: []
        };

        const result = transformToCase(paymentData, refundData);

        expect(result).toBeInstanceOf(Case);
        expect(result.serviceRequests).toHaveLength(2);
        expect(result.serviceRequests[0].paymentReference).toBe('RC-001');
        expect(result.serviceRequests[1].paymentReference).toBe('RC-002');
    });

    it('should attach payment status history', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: '12345', payment_reference: 'RC-001' }
            ],
            fees: [],
            payments: [
                {
                    id: 1,
                    payment_link_id: 1,
                    ccd_case_number: '12345',
                    reference: 'RC-001',
                    amount: '100.00'
                }
            ],
            apportionments: [],
            remissions: [],
            payment_status_history: [
                {
                    id: 1,
                    payment_id: 1,
                    status: 'Success',
                    external_status: 'success',
                    message: 'Payment successful'
                }
            ],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [],
            refund_status_history: [],
            refund_fees: []
        };

        const result = transformToCase(paymentData, refundData);

        expect(result.serviceRequests[0].payments[0].statusHistory).toHaveLength(1);
        expect(result.serviceRequests[0].payments[0].statusHistory[0].status).toBe('Success');
    });

    it('should attach refund status history', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: '12345', payment_reference: 'RC-001' }
            ],
            fees: [],
            payments: [
                {
                    id: 1,
                    payment_link_id: 1,
                    ccd_case_number: '12345',
                    reference: 'RC-001',
                    amount: '100.00'
                }
            ],
            apportionments: [],
            remissions: [],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [
                {
                    id: 1,
                    ccd_case_number: '12345',
                    payment_reference: 'RC-001',
                    reference: 'RF-001',
                    amount: '50.00'
                }
            ],
            refund_status_history: [
                {
                    id: 1,
                    refunds_id: 1,
                    status: 'Approved',
                    notes: 'Approved by manager'
                }
            ],
            refund_fees: []
        };

        const result = transformToCase(paymentData, refundData);

        expect(result.serviceRequests[0].payments[0].refunds[0].statusHistory).toHaveLength(1);
        expect(result.serviceRequests[0].payments[0].refunds[0].statusHistory[0].status).toBe('Approved');
    });

    it('should handle refunds without matching payment reference', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: '12345', payment_reference: 'RC-001' }
            ],
            fees: [],
            payments: [
                {
                    id: 1,
                    payment_link_id: 1,
                    ccd_case_number: '12345',
                    reference: 'RC-001',
                    amount: '100.00'
                }
            ],
            apportionments: [],
            remissions: [],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [
                {
                    id: 1,
                    ccd_case_number: '12345',
                    payment_reference: 'RC-999', // Non-existent payment
                    reference: 'RF-001',
                    amount: '50.00'
                }
            ],
            refund_status_history: [],
            refund_fees: []
        };

        const result = transformToCase(paymentData, refundData);

        // Refund should not be attached since payment doesn't exist
        expect(result.serviceRequests[0].payments[0].refunds).toHaveLength(0);
    });

    it('should handle refunds for non-existent CCD', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: '12345', payment_reference: 'RC-001' }
            ],
            fees: [],
            payments: [],
            apportionments: [],
            remissions: [],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [
                {
                    id: 1,
                    ccd_case_number: '99999', // Non-existent CCD
                    payment_reference: 'RC-001',
                    reference: 'RF-001',
                    amount: '50.00'
                }
            ],
            refund_status_history: [],
            refund_fees: []
        };

        const result = transformToCase(paymentData, refundData);

        // Should still return the case, just without refunds
        expect(result).toBeInstanceOf(Case);
    });

    it('should handle refund fees', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: '12345', payment_reference: 'RC-001' }
            ],
            fees: [],
            payments: [
                {
                    id: 1,
                    payment_link_id: 1,
                    ccd_case_number: '12345',
                    reference: 'RC-001',
                    amount: '100.00'
                }
            ],
            apportionments: [],
            remissions: [],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [
                {
                    id: 1,
                    ccd_case_number: '12345',
                    payment_reference: 'RC-001',
                    reference: 'RF-001',
                    amount: '50.00'
                }
            ],
            refund_status_history: [],
            refund_fees: [
                {
                    id: 1,
                    refunds_id: 1,
                    fee_id: 1,
                    refund_amount: '50.00',
                    code: 'FEE001',
                    version: 1
                }
            ]
        };

        const result = transformToCase(paymentData, refundData);

        expect(result.serviceRequests[0].payments[0].refunds[0].fees).toHaveLength(1);
        expect(result.serviceRequests[0].payments[0].refunds[0].fees[0].refundAmount).toBe('50.00');
    });

    it('should handle apportionments', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: '12345', payment_reference: 'RC-001' }
            ],
            fees: [],
            payments: [
                {
                    id: 1,
                    payment_link_id: 1,
                    ccd_case_number: '12345',
                    reference: 'RC-001',
                    amount: '100.00'
                }
            ],
            apportionments: [
                {
                    id: 1,
                    payment_id: 1,
                    fee_id: 1,
                    apportion_amount: '100.00'
                }
            ],
            remissions: [],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [],
            refund_status_history: [],
            refund_fees: []
        };

        const result = transformToCase(paymentData, refundData);

        expect(result.serviceRequests[0].payments[0].apportionments).toHaveLength(1);
        expect(result.serviceRequests[0].payments[0].apportionments[0].feeId).toBe(1);
    });

    it('should handle orphaned payment status history', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: '12345', payment_reference: 'RC-001' }
            ],
            fees: [],
            payments: [],
            apportionments: [],
            remissions: [],
            payment_status_history: [
                {
                    id: 1,
                    payment_id: 999, // Non-existent payment
                    status: 'Success'
                }
            ],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [],
            refund_status_history: [],
            refund_fees: []
        };

        const result = transformToCase(paymentData, refundData);

        // Should not crash, just ignore orphaned status
        expect(result).toBeInstanceOf(Case);
    });

    it('should handle orphaned refund status history', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: '12345', payment_reference: 'RC-001' }
            ],
            fees: [],
            payments: [],
            apportionments: [],
            remissions: [],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [],
            refund_status_history: [
                {
                    id: 1,
                    refunds_id: 999, // Non-existent refund
                    status: 'Approved'
                }
            ],
            refund_fees: []
        };

        const result = transformToCase(paymentData, refundData);

        // Should not crash, just ignore orphaned status
        expect(result).toBeInstanceOf(Case);
    });

    it('should handle remissions for non-existent fees', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: '12345', payment_reference: 'RC-001' }
            ],
            fees: [],
            payments: [],
            apportionments: [],
            remissions: [
                {
                    id: 1,
                    payment_link_id: 1,
                    fee_id: 999, // Non-existent fee
                    hwf_reference: 'HWF-001',
                    hwf_amount: '275.00'
                }
            ],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [],
            refund_status_history: [],
            refund_fees: []
        };

        const result = transformToCase(paymentData, refundData);

        // Should not crash, just ignore orphaned remission
        expect(result).toBeInstanceOf(Case);
    });

    it('should handle fees with mismatched CCD', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: '12345', payment_reference: 'RC-001' }
            ],
            fees: [
                {
                    id: 1,
                    payment_link_id: 1,
                    ccd_case_number: '99999', // Different CCD
                    code: 'FEE001',
                    version: 1,
                    fee_amount: '100'
                }
            ],
            payments: [],
            apportionments: [],
            remissions: [],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [],
            refund_status_history: [],
            refund_fees: []
        };

        const result = transformToCase(paymentData, refundData);

        // Fee should not be attached due to CCD mismatch
        expect(result.serviceRequests[0].fees).toHaveLength(0);
    });

    it('should handle fees with non-existent payment_link_id', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: '12345', payment_reference: 'RC-001' }
            ],
            fees: [
                {
                    id: 1,
                    payment_link_id: 999, // Non-existent link
                    ccd_case_number: '12345',
                    code: 'FEE001',
                    version: 1,
                    fee_amount: '100'
                }
            ],
            payments: [],
            apportionments: [],
            remissions: [],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [],
            refund_status_history: [],
            refund_fees: []
        };

        const result = transformToCase(paymentData, refundData);

        // Fee should not be attached due to invalid link
        expect(result.serviceRequests[0].fees).toHaveLength(0);
    });

    it('should handle payments with non-existent payment_link_id', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: '12345', payment_reference: 'RC-001' }
            ],
            fees: [],
            payments: [
                {
                    id: 1,
                    payment_link_id: 999, // Non-existent link
                    ccd_case_number: '12345',
                    reference: 'RC-001',
                    amount: '100.00'
                }
            ],
            apportionments: [],
            remissions: [],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [],
            refund_status_history: [],
            refund_fees: []
        };

        const result = transformToCase(paymentData, refundData);

        // Payment should not be attached due to invalid link
        expect(result.serviceRequests[0].payments).toHaveLength(0);
    });

    it('should handle remissions with mismatched CCD', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: '12345', payment_reference: 'RC-001' }
            ],
            fees: [
                {
                    id: 1,
                    payment_link_id: 1,
                    ccd_case_number: '12345',
                    code: 'FEE001',
                    version: 1,
                    fee_amount: '550'
                }
            ],
            payments: [],
            apportionments: [],
            remissions: [
                {
                    id: 1,
                    payment_link_id: 1,
                    fee_id: 1,
                    hwf_reference: 'HWF-001',
                    hwf_amount: '275.00'
                }
            ],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [],
            refund_status_history: [],
            refund_fees: []
        };

        const result = transformToCase(paymentData, refundData);

        // Remission should be attached
        expect(result.serviceRequests[0].fees[0].remissions).toHaveLength(1);
    });
});
