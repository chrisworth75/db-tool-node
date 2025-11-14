import { mergeAllData } from './mergeService.js';

describe('mergeAllData', () => {
    it('should merge comprehensive payment and refund data', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: '12345' },
                { id: 2, ccd_case_number: '12345' }
            ],
            fees: [
                { id: 1, payment_link_id: 1, fee_amount: '100.00' },
                { id: 2, payment_link_id: 2, fee_amount: '200.00' }
            ],
            payments: [
                { id: 1, payment_link_id: 1, amount: '100.00' },
                { id: 2, payment_link_id: 2, amount: '200.00' }
            ],
            apportionments: [
                { id: 1, payment_id: 1, fee_id: 1 }
            ],
            remissions: [
                { id: 1, payment_link_id: 1, hwf_amount: '50.00' }
            ],
            payment_status_history: [
                { id: 1, payment_id: 1, status: 'Success' }
            ],
            payment_audit_history: [
                { id: 1, ccd_case_no: '12345' }
            ]
        };

        const refundData = {
            refunds: [
                { id: 1, ccd_case_number: '12345', amount: '75.00' }
            ],
            refund_status_history: [
                { id: 1, refunds_id: 1, status: 'Approved' }
            ],
            refund_fees: [
                { id: 1, refunds_id: 1, fee_id: 1 }
            ]
        };

        const result = mergeAllData(paymentData, refundData);

        expect(result.ccd_case_numbers).toEqual(['12345']);
        expect(result.payments.payment_fee_links).toEqual(paymentData.payment_fee_links);
        expect(result.payments.fees).toEqual(paymentData.fees);
        expect(result.payments.payments).toEqual(paymentData.payments);
        expect(result.payments.apportionments).toEqual(paymentData.apportionments);
        expect(result.payments.remissions).toEqual(paymentData.remissions);
        expect(result.refunds.refunds).toEqual(refundData.refunds);
        expect(result.summary.payment_count).toBe(2);
        expect(result.summary.refund_count).toBe(1);
        expect(result.summary.total_payment_amount).toBe(300);
        expect(result.summary.total_refund_amount).toBe(75);
        expect(result.summary.total_fee_amount).toBe(300);
        expect(result.summary.total_remission_amount).toBe(50);
        expect(result.summary.net_amount).toBe(225);
    });

    it('should handle empty payment data', () => {
        const paymentData = {
            payment_fee_links: [],
            fees: [],
            payments: [],
            apportionments: [],
            remissions: [],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [{ id: 1, ccd_case_number: '67890', amount: '25.00' }],
            refund_status_history: [],
            refund_fees: []
        };

        const result = mergeAllData(paymentData, refundData);

        expect(result.ccd_case_numbers).toEqual(['67890']);
        expect(result.summary.payment_count).toBe(0);
        expect(result.summary.refund_count).toBe(1);
        expect(result.summary.total_payment_amount).toBe(0);
        expect(result.summary.total_refund_amount).toBe(25);
        expect(result.summary.net_amount).toBe(-25);
    });

    it('should handle empty refund data', () => {
        const paymentData = {
            payment_fee_links: [{ id: 1, ccd_case_number: '54321' }],
            fees: [{ id: 1, fee_amount: '150.00' }],
            payments: [{ id: 1, amount: '150.00' }],
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

        const result = mergeAllData(paymentData, refundData);

        expect(result.ccd_case_numbers).toEqual(['54321']);
        expect(result.summary.payment_count).toBe(1);
        expect(result.summary.refund_count).toBe(0);
        expect(result.summary.total_payment_amount).toBe(150);
        expect(result.summary.total_refund_amount).toBe(0);
        expect(result.summary.net_amount).toBe(150);
    });

    it('should handle multiple CCD numbers', () => {
        const paymentData = {
            payment_fee_links: [
                { id: 1, ccd_case_number: 'CCD1' },
                { id: 2, ccd_case_number: 'CCD2' }
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
                { id: 1, ccd_case_number: 'CCD1', amount: '10' },
                { id: 2, ccd_case_number: 'CCD3', amount: '20' }
            ],
            refund_status_history: [],
            refund_fees: []
        };

        const result = mergeAllData(paymentData, refundData);

        expect(result.ccd_case_numbers.sort()).toEqual(['CCD1', 'CCD2', 'CCD3']);
    });

    it('should handle null amounts gracefully', () => {
        const paymentData = {
            payment_fee_links: [],
            fees: [{ id: 1, fee_amount: null }],
            payments: [{ id: 1, amount: null }],
            apportionments: [],
            remissions: [{ id: 1, hwf_amount: null }],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [{ id: 1, amount: null }],
            refund_status_history: [],
            refund_fees: []
        };

        const result = mergeAllData(paymentData, refundData);

        expect(result.summary.total_payment_amount).toBe(0);
        expect(result.summary.total_refund_amount).toBe(0);
        expect(result.summary.total_fee_amount).toBe(0);
        expect(result.summary.total_remission_amount).toBe(0);
        expect(result.summary.net_amount).toBe(0);
    });

    it('should handle missing ccd_case_number fields', () => {
        const paymentData = {
            payment_fee_links: [{ id: 1 }], // No ccd_case_number
            fees: [],
            payments: [],
            apportionments: [],
            remissions: [],
            payment_status_history: [],
            payment_audit_history: []
        };

        const refundData = {
            refunds: [{ id: 1 }], // No ccd_case_number
            refund_status_history: [],
            refund_fees: []
        };

        const result = mergeAllData(paymentData, refundData);

        expect(result.ccd_case_numbers).toEqual([]);
    });
});
