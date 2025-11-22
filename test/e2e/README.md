# End-to-End Tests

This directory contains end-to-end tests for db-tool-node that verify the complete data flow:
1. Load test data into both databases (payments and refunds)
2. Run the db-tool CLI to query the data
3. Verify the output matches expected results
4. Clean up test data

## Structure

```
test/e2e/
├── fixtures/
│   └── testData.js           # Test data definitions
├── helpers/
│   └── dataLoader.js         # Database loading/cleanup utilities
├── dbTool.e2e.test.js        # E2E test suite
├── load-test-data.js         # Standalone data loader script
└── README.md                 # This file
```

## Running E2E Tests

### Prerequisites

Ensure both databases are running:
```bash
docker-compose -f /Users/chris/dev-feepay/docker-compose.yml up -d payments-db refunds-db
```

### Run the E2E Test Suite

```bash
npm run test:e2e
```

This will:
1. Clean up any existing test data for CCD `1234567890123456`
2. Insert fresh test data into both databases
3. Run the db-tool CLI against the test data
4. Verify the output matches expectations
5. Clean up test data after tests complete

### Run All Tests (Unit + E2E)

```bash
npm run test:all
```

## Manual Test Data Loading

You can manually load or clean test data without running the full test suite:

### Load Test Data

```bash
npm run load-test-data
```

Or directly:
```bash
node test/e2e/load-test-data.js load
```

After loading, you can query manually:
```bash
node src/index.js --ccd 1234567890123456
```

### Clean Test Data

```bash
npm run clean-test-data
```

Or directly:
```bash
node test/e2e/load-test-data.js clean
```

## Database Configuration

The tests use environment variables for database configuration, with defaults for local development:

### Payments Database
- `PAYMENTS_DB_HOST` (default: localhost)
- `PAYMENTS_DB_PORT` (default: 5446)
- `PAYMENTS_DB_USER` (default: postgres)
- `PAYMENTS_DB_PASSWORD` (default: postgres)
- `PAYMENTS_DB_NAME` (default: payments)

### Refunds Database
- `REFUNDS_DB_HOST` (default: localhost)
- `REFUNDS_DB_PORT` (default: 5447)
- `REFUNDS_DB_USER` (default: postgres)
- `REFUNDS_DB_PASSWORD` (default: postgres)
- `REFUNDS_DB_NAME` (default: refunds)

## Test Data

The test data includes:
- **CCD Case Number**: 1234567890123456
- **Payment Fee Link**: Complete case metadata
- **Fee**: £550.00 divorce fee (FEE0123)
- **Payment**: £550.00 successful card payment
- **Apportionment**: Full fee payment allocation
- **Refund**: £100.00 approved refund (overpayment)
- **Status History**: Payment and refund status tracking
- **Audit History**: Payment creation audit log

## What the Tests Verify

1. ✅ Data retrieval and merging from both databases
2. ✅ Case identifiers (CCD number, references)
3. ✅ Case metadata (service type, organization)
4. ✅ Fee data (amount, status)
5. ✅ Payment data (amount, status, history)
6. ✅ Refund data (amount, status, history)
7. ✅ Apportionment data
8. ✅ Summary calculations (totals, amount due)
9. ✅ Empty data handling for non-existent cases

## Adding New Test Cases

To add additional test scenarios:

1. Add new fixture data to `fixtures/testData.js`
2. Create corresponding test cases in `dbTool.e2e.test.js`
3. Ensure cleanup covers the new test data

## Troubleshooting

### Tests fail with connection errors
- Verify databases are running: `docker ps | grep -E 'payments-db|refunds-db'`
- Check database ports: `lsof -i :5446` and `lsof -i :5447`
- Ensure database schemas are initialized

### Tests fail with data conflicts
- Clean test data manually: `npm run clean-test-data`
- Check for existing test data: Query CCD `1234567890123456`

### Tests timeout
- Increase Jest timeout in test file (currently 30 seconds)
- Check database performance
- Verify network connectivity
