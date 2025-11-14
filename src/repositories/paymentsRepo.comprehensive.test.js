import { paymentsDb } from '../config/db.js';
import { getAllPaymentDataByCCD, getAllPaymentDataByRC } from './paymentsRepo.js';

// Store original query function
const originalQuery = paymentsDb.query;

describe('getAllPaymentDataByCCD', () => {
    afterEach(() => {
        if (paymentsDb.query !== originalQuery) {
            paymentsDb.query = originalQuery;
        }
    });

    it('should fetch all related payment data for a CCD', async () => {
        const mockData = {
            payment_fee_links: [{ id: 1, ccd_case_number: '12345' }],
            fees: [{ id: 1, payment_link_id: 1 }],
            payments: [{ id: 1, payment_link_id: 1, amount: '100' }],
            apportionments: [{ id: 1, payment_link_id: 1 }],
            remissions: [{ id: 1, payment_link_id: 1 }],
            audit: [{ id: 1, ccd_case_no: '12345' }],
            status_history: [{ id: 1, payment_id: 1 }]
        };

        let queryCount = 0;
        paymentsDb.query = async (query, params) => {
            queryCount++;
            if (query.includes('payment_fee_link')) {
                return { rows: mockData.payment_fee_links };
            } else if (query.includes('fee WHERE')) {
                return { rows: mockData.fees };
            } else if (query.includes('payment WHERE')) {
                return { rows: mockData.payments };
            } else if (query.includes('fee_pay_apportion')) {
                return { rows: mockData.apportionments };
            } else if (query.includes('remission')) {
                return { rows: mockData.remissions };
            } else if (query.includes('payment_audit_history')) {
                return { rows: mockData.audit };
            } else if (query.includes('status_history')) {
                return { rows: mockData.status_history };
            }
            return { rows: [] };
        };

        const result = await getAllPaymentDataByCCD('12345');

        expect(result.payment_fee_links).toEqual(mockData.payment_fee_links);
        expect(result.fees).toEqual(mockData.fees);
        expect(result.payments).toEqual(mockData.payments);
        expect(result.apportionments).toEqual(mockData.apportionments);
        expect(result.remissions).toEqual(mockData.remissions);
        expect(result.payment_status_history).toEqual(mockData.status_history);
        expect(result.payment_audit_history).toEqual(mockData.audit);
    });

    it('should return empty structure when no payment_fee_link exists', async () => {
        paymentsDb.query = async () => ({ rows: [] });

        const result = await getAllPaymentDataByCCD('99999');

        expect(result.payment_fee_links).toEqual([]);
        expect(result.fees).toEqual([]);
        expect(result.payments).toEqual([]);
        expect(result.apportionments).toEqual([]);
        expect(result.remissions).toEqual([]);
        expect(result.payment_status_history).toEqual([]);
        expect(result.payment_audit_history).toEqual([]);
    });

    it('should handle CCD with payment_fee_links but no payments', async () => {
        const mockData = {
            payment_fee_links: [{ id: 1, ccd_case_number: '12345' }],
            fees: [],
            payments: [], // No payments, so no payment IDs for status history
            apportionments: [],
            remissions: [],
            audit: [],
            status_history: []
        };

        paymentsDb.query = async (query, params) => {
            if (query.includes('payment_fee_link')) {
                return { rows: mockData.payment_fee_links };
            }
            return { rows: [] };
        };

        const result = await getAllPaymentDataByCCD('12345');

        expect(result.payment_fee_links).toEqual(mockData.payment_fee_links);
        expect(result.payments).toEqual([]);
        expect(result.payment_status_history).toEqual([]); // Should handle empty paymentIds
    });
});

describe('getAllPaymentDataByRC', () => {
    afterEach(() => {
        if (paymentsDb.query !== originalQuery) {
            paymentsDb.query = originalQuery;
        }
    });

    it('should fetch all related payment data by RC', async () => {
        const mockData = {
            payments: [{ id: 1, reference: 'RC-123', payment_link_id: 1, amount: '100' }],
            payment_fee_links: [{ id: 1, ccd_case_number: '12345' }],
            fees: [{ id: 1, payment_link_id: 1 }],
            apportionments: [{ id: 1, payment_link_id: 1 }],
            remissions: [{ id: 1, payment_link_id: 1 }],
            audit: [{ id: 1, ccd_case_no: '12345' }],
            status_history: [{ id: 1, payment_id: 1 }]
        };

        paymentsDb.query = async (query, params) => {
            if (query.includes('payment WHERE reference')) {
                return { rows: mockData.payments };
            } else if (query.includes('payment_fee_link WHERE id')) {
                return { rows: mockData.payment_fee_links };
            } else if (query.includes('fee WHERE')) {
                return { rows: mockData.fees };
            } else if (query.includes('fee_pay_apportion')) {
                return { rows: mockData.apportionments };
            } else if (query.includes('remission')) {
                return { rows: mockData.remissions };
            } else if (query.includes('payment_audit_history')) {
                return { rows: mockData.audit };
            } else if (query.includes('status_history')) {
                return { rows: mockData.status_history };
            }
            return { rows: [] };
        };

        const result = await getAllPaymentDataByRC('RC-123');

        expect(result.payment_fee_links).toEqual(mockData.payment_fee_links);
        expect(result.fees).toEqual(mockData.fees);
        expect(result.payments).toEqual(mockData.payments);
        expect(result.apportionments).toEqual(mockData.apportionments);
        expect(result.remissions).toEqual(mockData.remissions);
        expect(result.payment_status_history).toEqual(mockData.status_history);
        expect(result.payment_audit_history).toEqual(mockData.audit);
    });

    it('should return empty structure when RC not found', async () => {
        paymentsDb.query = async () => ({ rows: [] });

        const result = await getAllPaymentDataByRC('RC-NOTFOUND');

        expect(result.payment_fee_links).toEqual([]);
        expect(result.fees).toEqual([]);
        expect(result.payments).toEqual([]);
        expect(result.apportionments).toEqual([]);
        expect(result.remissions).toEqual([]);
        expect(result.payment_status_history).toEqual([]);
        expect(result.payment_audit_history).toEqual([]);
    });
});
