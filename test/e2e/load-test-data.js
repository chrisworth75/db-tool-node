#!/usr/bin/env node
/**
 * Standalone script to load test data into databases
 * Usage: node test/e2e/load-test-data.js [load|clean]
 */

import { loadPaymentsData, loadRefundsData, cleanupTestData } from './helpers/dataLoader.js';
import { paymentsData, refundsData, TEST_CONFIG } from './fixtures/testData.js';

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

async function main() {
    const command = process.argv[2] || 'load';

    console.log('🔧 Database Configuration:');
    console.log('  Payments DB:', `${paymentsConfig.host}:${paymentsConfig.port}/${paymentsConfig.database}`);
    console.log('  Refunds DB:', `${refundsConfig.host}:${refundsConfig.port}/${refundsConfig.database}`);
    console.log('  Test CCD:', TEST_CONFIG.TEST_CCD);
    console.log('');

    try {
        if (command === 'load') {
            console.log('📥 Loading test data...');
            await loadPaymentsData(paymentsData, paymentsConfig);
            await loadRefundsData(refundsData, refundsConfig);
            console.log('');
            console.log('✅ Test data loaded successfully!');
            console.log('');
            console.log('You can now query the data with:');
            console.log(`  node src/index.js --ccd ${TEST_CONFIG.TEST_CCD}`);
        } else if (command === 'clean') {
            console.log('🧹 Cleaning test data...');
            await cleanupTestData(TEST_CONFIG.TEST_CCD, paymentsConfig, refundsConfig);
            console.log('');
            console.log('✅ Test data cleaned up successfully!');
        } else {
            console.error('❌ Unknown command:', command);
            console.log('Usage: node test/e2e/load-test-data.js [load|clean]');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

main();
