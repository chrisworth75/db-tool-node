import { refundsDb } from '../config/db.js';
import { getAllRefundDataByCCD, getAllRefundDataByPaymentRef } from './refundsRepo.js';

// Store original query function
const originalQuery = refundsDb.query;

describe('getAllRefundDataByCCD', () => {
    afterEach(() => {
        if (refundsDb.query !== originalQuery) {
            refundsDb.query = originalQuery;
        }
    });

    it('should fetch all related refund data for a CCD', async () => {
        const mockData = {
            refunds: [{ id: 1, ccd_case_number: '12345', amount: '50' }],
            status_history: [{ id: 1, refunds_id: 1, status: 'Approved' }],
            refund_fees: [{ id: 1, refunds_id: 1, fee_id: 1 }]
        };

        refundsDb.query = async (query, params) => {
            if (query.includes('refunds WHERE')) {
                return { rows: mockData.refunds };
            } else if (query.includes('status_history')) {
                return { rows: mockData.status_history };
            } else if (query.includes('refund_fees')) {
                return { rows: mockData.refund_fees };
            }
            return { rows: [] };
        };

        const result = await getAllRefundDataByCCD('12345');

        expect(result.refunds).toEqual(mockData.refunds);
        expect(result.refund_status_history).toEqual(mockData.status_history);
        expect(result.refund_fees).toEqual(mockData.refund_fees);
    });

    it('should return empty structure when no refunds exist', async () => {
        refundsDb.query = async () => ({ rows: [] });

        const result = await getAllRefundDataByCCD('99999');

        expect(result.refunds).toEqual([]);
        expect(result.refund_status_history).toEqual([]);
        expect(result.refund_fees).toEqual([]);
    });
});

describe('getAllRefundDataByPaymentRef', () => {
    afterEach(() => {
        if (refundsDb.query !== originalQuery) {
            refundsDb.query = originalQuery;
        }
    });

    it('should fetch all related refund data by payment reference', async () => {
        const mockData = {
            refunds: [{ id: 1, payment_reference: 'RC-123', amount: '50' }],
            status_history: [{ id: 1, refunds_id: 1, status: 'Approved' }],
            refund_fees: [{ id: 1, refunds_id: 1, fee_id: 1 }]
        };

        refundsDb.query = async (query, params) => {
            if (query.includes('payment_reference')) {
                return { rows: mockData.refunds };
            } else if (query.includes('status_history')) {
                return { rows: mockData.status_history };
            } else if (query.includes('refund_fees')) {
                return { rows: mockData.refund_fees };
            }
            return { rows: [] };
        };

        const result = await getAllRefundDataByPaymentRef('RC-123');

        expect(result.refunds).toEqual(mockData.refunds);
        expect(result.refund_status_history).toEqual(mockData.status_history);
        expect(result.refund_fees).toEqual(mockData.refund_fees);
    });

    it('should return empty structure when payment reference not found', async () => {
        refundsDb.query = async () => ({ rows: [] });

        const result = await getAllRefundDataByPaymentRef('RC-NOTFOUND');

        expect(result.refunds).toEqual([]);
        expect(result.refund_status_history).toEqual([]);
        expect(result.refund_fees).toEqual([]);
    });
});
