import { paymentsDb } from '../config/db.js';
import { getPaymentsByCCD } from './paymentsRepo.js';

// Store original query function
const originalQuery = paymentsDb.query;

describe('getPaymentsByCCD', () => {
    afterEach(() => {
        // Restore original if modified
        if (paymentsDb.query !== originalQuery) {
            paymentsDb.query = originalQuery;
        }
    });

    it('should query payments database with correct CCD', async () => {
        const mockRows = [
            { id: 1, ccd_case_number: '12345', amount: '100.00' },
            { id: 2, ccd_case_number: '12345', amount: '200.00' }
        ];

        let capturedQuery, capturedParams;
        paymentsDb.query = async (query, params) => {
            capturedQuery = query;
            capturedParams = params;
            return { rows: mockRows };
        };

        const result = await getPaymentsByCCD('12345');

        expect(capturedQuery).toBe('SELECT * FROM payment WHERE ccd_case_number = $1');
        expect(capturedParams).toEqual(['12345']);
        expect(result).toEqual(mockRows);
    });

    it('should return empty array when no payments found', async () => {
        paymentsDb.query = async () => ({ rows: [] });

        const result = await getPaymentsByCCD('99999');

        expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
        const error = new Error('Database connection failed');
        paymentsDb.query = async () => {
            throw error;
        };

        await expect(getPaymentsByCCD('12345')).rejects.toThrow('Database connection failed');
    });

    it('should pass through different CCD formats', async () => {
        let capturedParams;
        paymentsDb.query = async (query, params) => {
            capturedParams = params;
            return { rows: [] };
        };

        await getPaymentsByCCD('ABC-123');

        expect(capturedParams).toEqual(['ABC-123']);
    });
});
