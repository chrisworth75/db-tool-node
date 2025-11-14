import { mergePaymentsAndRefunds } from './mergeService.js';

describe('mergePaymentsAndRefunds', () => {
    it('should merge payments and refunds with correct summary', () => {
        const payments = [
            { ccd_case_number: '12345', amount: '100.50', id: 1 },
            { ccd_case_number: '12345', amount: '200.25', id: 2 }
        ];
        const refunds = [
            { ccd_case_number: '12345', amount: '50.00', id: 1 }
        ];

        const result = mergePaymentsAndRefunds(payments, refunds);

        expect(result).toEqual({
            ccd: '12345',
            payments,
            refunds,
            summary: {
                paymentCount: 2,
                refundCount: 1,
                totalPayments: 300.75,
                totalRefunds: 50.00
            }
        });
    });

    it('should handle empty payments array', () => {
        const payments = [];
        const refunds = [
            { ccd_case_number: '67890', amount: '25.00', id: 1 }
        ];

        const result = mergePaymentsAndRefunds(payments, refunds);

        expect(result).toEqual({
            ccd: '67890',
            payments,
            refunds,
            summary: {
                paymentCount: 0,
                refundCount: 1,
                totalPayments: 0,
                totalRefunds: 25.00
            }
        });
    });

    it('should handle empty refunds array', () => {
        const payments = [
            { ccd_case_number: '54321', amount: '150.00', id: 1 }
        ];
        const refunds = [];

        const result = mergePaymentsAndRefunds(payments, refunds);

        expect(result).toEqual({
            ccd: '54321',
            payments,
            refunds,
            summary: {
                paymentCount: 1,
                refundCount: 0,
                totalPayments: 150.00,
                totalRefunds: 0
            }
        });
    });

    it('should handle both arrays empty', () => {
        const payments = [];
        const refunds = [];

        const result = mergePaymentsAndRefunds(payments, refunds);

        expect(result).toEqual({
            ccd: undefined,
            payments,
            refunds,
            summary: {
                paymentCount: 0,
                refundCount: 0,
                totalPayments: 0,
                totalRefunds: 0
            }
        });
    });

    it('should handle null amounts', () => {
        const payments = [
            { ccd_case_number: '11111', amount: null, id: 1 },
            { ccd_case_number: '11111', amount: '100', id: 2 }
        ];
        const refunds = [
            { ccd_case_number: '11111', amount: null, id: 1 }
        ];

        const result = mergePaymentsAndRefunds(payments, refunds);

        expect(result).toEqual({
            ccd: '11111',
            payments,
            refunds,
            summary: {
                paymentCount: 2,
                refundCount: 1,
                totalPayments: 100,
                totalRefunds: 0
            }
        });
    });

    it('should handle missing amount fields', () => {
        const payments = [
            { ccd_case_number: '22222', id: 1 },
            { ccd_case_number: '22222', amount: '50', id: 2 }
        ];
        const refunds = [
            { ccd_case_number: '22222', id: 1 }
        ];

        const result = mergePaymentsAndRefunds(payments, refunds);

        expect(result).toEqual({
            ccd: '22222',
            payments,
            refunds,
            summary: {
                paymentCount: 2,
                refundCount: 1,
                totalPayments: 50,
                totalRefunds: 0
            }
        });
    });

    it('should handle string amounts correctly', () => {
        const payments = [
            { ccd_case_number: '33333', amount: '99.99', id: 1 }
        ];
        const refunds = [
            { ccd_case_number: '33333', amount: '10.01', id: 1 }
        ];

        const result = mergePaymentsAndRefunds(payments, refunds);

        expect(result.summary.totalPayments).toBe(99.99);
        expect(result.summary.totalRefunds).toBe(10.01);
    });

    it('should use refunds ccd when payments is empty', () => {
        const payments = [];
        const refunds = [
            { ccd_case_number: 'REF123', amount: '5.00', id: 1 }
        ];

        const result = mergePaymentsAndRefunds(payments, refunds);

        expect(result.ccd).toBe('REF123');
    });
});
