import { refundsDb, paymentsDb } from './db.js';

describe('Database Configuration', () => {
    it('should export refundsDb', () => {
        expect(refundsDb).toBeDefined();
        expect(typeof refundsDb.query).toBe('function');
    });

    it('should export paymentsDb', () => {
        expect(paymentsDb).toBeDefined();
        expect(typeof paymentsDb.query).toBe('function');
    });

    it('should export two different database pools', () => {
        expect(refundsDb).not.toBe(paymentsDb);
    });
});
