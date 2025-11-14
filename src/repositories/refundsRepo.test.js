import { refundsDb } from '../config/db.js';
import { getRefundsByCCD } from './refundsRepo.js';

// Store original query function
const originalQuery = refundsDb.query;

describe('getRefundsByCCD', () => {
    afterEach(() => {
        // Restore original if modified
        if (refundsDb.query !== originalQuery) {
            refundsDb.query = originalQuery;
        }
    });

    it('should query refunds database with correct CCD', async () => {
        const mockRows = [
            { id: 1, ccd_case_number: '12345', amount: '50.00' },
            { id: 2, ccd_case_number: '12345', amount: '25.00' }
        ];

        let capturedQuery, capturedParams;
        refundsDb.query = async (query, params) => {
            capturedQuery = query;
            capturedParams = params;
            return { rows: mockRows };
        };

        const result = await getRefundsByCCD('12345');

        expect(capturedQuery).toBe('SELECT * FROM refunds WHERE ccd_case_number = $1');
        expect(capturedParams).toEqual(['12345']);
        expect(result).toEqual(mockRows);
    });

    it('should return empty array when no refunds found', async () => {
        refundsDb.query = async () => ({ rows: [] });

        const result = await getRefundsByCCD('99999');

        expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
        const error = new Error('Database connection failed');
        refundsDb.query = async () => {
            throw error;
        };

        await expect(getRefundsByCCD('12345')).rejects.toThrow('Database connection failed');
    });

    it('should pass through different CCD formats', async () => {
        let capturedParams;
        refundsDb.query = async (query, params) => {
            capturedParams = params;
            return { rows: [] };
        };

        await getRefundsByCCD('XYZ-789');

        expect(capturedParams).toEqual(['XYZ-789']);
    });
});
