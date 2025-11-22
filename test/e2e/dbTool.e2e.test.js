/**
 * End-to-end tests for db-tool-node
 * Tests the complete flow: load data → query → verify output
 */

import { spawn } from 'child_process';
import { loadPaymentsData, loadRefundsData, cleanupTestData } from './helpers/dataLoader.js';
import { paymentsData, refundsData, expectedOutput, TEST_CONFIG } from './fixtures/testData.js';

// Database configurations from environment or defaults
const paymentsConfig = {
    host: process.env.PAYMENTS_DB_HOST || 'localhost',
    port: process.env.PAYMENTS_DB_PORT || 5446,
    user: process.env.PAYMENTS_DB_USER || 'postgres',
    password: process.env.PAYMENTS_DB_PASSWORD || 'postgres',
    database: process.env.PAYMENTS_DB_NAME || 'payments'
};

const refundsConfig = {
    host: process.env.REFUNDS_DB_HOST || 'localhost',
    port: process.env.REFUNDS_DB_PORT || 5447,
    user: process.env.REFUNDS_DB_USER || 'postgres',
    password: process.env.REFUNDS_DB_PASSWORD || 'postgres',
    database: process.env.REFUNDS_DB_NAME || 'refunds'
};

/**
 * Runs the db-tool CLI and returns parsed JSON output
 */
async function runDbTool(ccdNumber) {
    return new Promise((resolve, reject) => {
        const child = spawn('node', ['src/index.js', '--ccd', ccdNumber], {
            env: {
                ...process.env,
                PAYMENTS_DB_HOST: paymentsConfig.host,
                PAYMENTS_DB_PORT: paymentsConfig.port,
                PAYMENTS_DB_USER: paymentsConfig.user,
                PAYMENTS_DB_PASSWORD: paymentsConfig.password,
                PAYMENTS_DB_NAME: paymentsConfig.database,
                REFUNDS_DB_HOST: refundsConfig.host,
                REFUNDS_DB_PORT: refundsConfig.port,
                REFUNDS_DB_USER: refundsConfig.user,
                REFUNDS_DB_PASSWORD: refundsConfig.password,
                REFUNDS_DB_NAME: refundsConfig.database
            }
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Process exited with code ${code}\nStderr: ${stderr}`));
                return;
            }

            try {
                // Extract JSON from output (skip any console.log lines)
                const lines = stdout.split('\n');

                // Find the first line that starts with { and take everything from there
                const firstJsonLine = lines.findIndex(line => line.trim().startsWith('{'));
                if (firstJsonLine === -1) {
                    reject(new Error(`No JSON found in output\nOutput: ${stdout}\nStderr: ${stderr}`));
                    return;
                }

                const jsonOutput = lines.slice(firstJsonLine).join('\n');
                const result = JSON.parse(jsonOutput);
                resolve(result);
            } catch (error) {
                reject(new Error(`Failed to parse output: ${error.message}\nOutput: ${stdout}\nStderr: ${stderr}`));
            }
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

describe('db-tool-node E2E Tests', () => {
    beforeAll(async () => {
        console.log('🧪 Setting up e2e test data...');

        // Clean up any existing test data first
        await cleanupTestData(TEST_CONFIG.TEST_CCD, paymentsConfig, refundsConfig);

        // Load fresh test data
        await loadPaymentsData(paymentsData, paymentsConfig);
        await loadRefundsData(refundsData, refundsConfig);

        console.log('✅ Test data loaded successfully');
    }, 30000); // 30 second timeout for setup

    afterAll(async () => {
        console.log('🧹 Cleaning up test data...');
        await cleanupTestData(TEST_CONFIG.TEST_CCD, paymentsConfig, refundsConfig);
        console.log('✅ Test data cleaned up');
    }, 30000);

    test('should retrieve and merge data correctly for test CCD case', async () => {
        const result = await runDbTool(TEST_CONFIG.TEST_CCD);

        // Verify the structure
        expect(result).toHaveProperty('case');
        expect(result).toHaveProperty('summary');

        const caseData = result.case;
        const summary = result.summary;

        // Verify case identifiers
        expect(caseData.ccdCaseNumber).toBe(expectedOutput.ccdCaseNumber);

        // Verify service requests
        expect(caseData.serviceRequests).toHaveLength(1);
        const serviceRequest = caseData.serviceRequests[0];

        expect(serviceRequest.paymentReference).toBe(expectedOutput.paymentReference);
        expect(serviceRequest.caseReference).toBe(expectedOutput.caseReference);

        // Verify fees
        expect(serviceRequest.fees).toHaveLength(expectedOutput.expectedFeeCount);
        expect(parseFloat(serviceRequest.fees[0].amount)).toBe(expectedOutput.expectedFeeAmount);

        // Verify payments
        expect(serviceRequest.payments).toHaveLength(expectedOutput.expectedPaymentCount);
        expect(parseFloat(serviceRequest.payments[0].amount)).toBe(expectedOutput.expectedPaymentAmount);

        // Verify refunds (nested under payments)
        const payment = serviceRequest.payments[0];
        expect(payment.refunds).toHaveLength(expectedOutput.expectedRefundCount);
        expect(parseFloat(payment.refunds[0].amount)).toBe(expectedOutput.expectedRefundAmount);

        // Verify apportionments (nested under payments)
        expect(payment.apportionments).toHaveLength(expectedOutput.expectedApportionmentCount);

        // Verify remissions (nested under fees)
        expect(serviceRequest.fees[0].remissions).toHaveLength(expectedOutput.expectedRemissionCount);

        // Verify summary totals
        expect(summary.totalFees).toBe(expectedOutput.expectedTotalFees);
        expect(summary.totalPayments).toBe(expectedOutput.expectedTotalPaid);
        expect(summary.totalRefunds).toBe(expectedOutput.expectedTotalRefunded);
        expect(summary.totalRemissions).toBe(expectedOutput.expectedTotalRemitted);
        expect(summary.amountDue).toBe(expectedOutput.expectedAmountDue);
    }, 30000);

    test('should return empty data for non-existent CCD case', async () => {
        const result = await runDbTool('9999999999999999');

        // When no data found, returns cases array
        expect(result).toHaveProperty('cases');
        expect(result).toHaveProperty('summary');

        expect(result.cases).toHaveLength(0);
        expect(result.summary.caseCount).toBe(0);
    }, 30000);

    test('should include payment status history', async () => {
        const result = await runDbTool(TEST_CONFIG.TEST_CCD);

        const caseData = result.case;
        const payment = caseData.serviceRequests[0].payments[0];

        expect(payment).toHaveProperty('statusHistory');
        expect(payment.statusHistory.length).toBeGreaterThan(0);
        expect(payment.statusHistory[0].status).toBe('success');
    }, 30000);

    test('should include refund status history', async () => {
        const result = await runDbTool(TEST_CONFIG.TEST_CCD);

        const caseData = result.case;
        const refund = caseData.serviceRequests[0].payments[0].refunds[0];

        expect(refund).toHaveProperty('statusHistory');
        expect(refund.statusHistory.length).toBeGreaterThan(0);
        expect(refund.statusHistory[0].status).toBe('Approved');
    }, 30000);

    test('should calculate correct summary totals', async () => {
        const result = await runDbTool(TEST_CONFIG.TEST_CCD);

        const summary = result.summary;

        // Verify summary has expected properties
        expect(summary).toHaveProperty('totalFees');
        expect(summary).toHaveProperty('totalPayments');
        expect(summary).toHaveProperty('totalRefunds');
        expect(summary).toHaveProperty('totalRemissions');
        expect(summary).toHaveProperty('amountDue');

        // For our test data: £550 fee, £550 paid, £100 refunded
        // Amount due should be 0 (fully paid)
        expect(summary.amountDue).toBe(0);
        expect(summary.totalFees).toBe(550);
        expect(summary.totalPayments).toBe(550);
        expect(summary.totalRefunds).toBe(100);
    }, 30000);
});
