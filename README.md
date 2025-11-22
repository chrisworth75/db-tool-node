# db-tool

Node.js CLI tool for querying CCPay payment and refund data.

## Overview

Queries and aggregates payment and refund data from two separate PostgreSQL databases (payments and refunds) and returns a unified case view.

## Installation

```bash
npm install
```

## Usage

```bash
node src/index.js --ccd 1111111111111111
```

## Architecture

```
src/
├── config/           # Database connections (pg)
├── models/
│   ├── domain/       # Clean domain models
│   └── database/     # Database models with validation
├── repositories/     # Database query layer
├── services/         # Data transformation
├── mappers/          # Bidirectional domain ↔ database mapping
└── index.js          # CLI entry point
```

## Database Configuration

- **Payments DB**: localhost:5446, database=payments
- **Refunds DB**: localhost:5447, database=refunds

Modify `src/config/db.js` to change settings.

## Output

Returns JSON with complete case data including fees, payments, refunds, remissions, and summary totals.

## Testing

### Unit Tests

```bash
npm test
```

Runs unit tests with 100% code coverage requirement.

### End-to-End Tests

```bash
npm run test:e2e
```

Runs e2e tests that:
1. Load test data into both databases
2. Run the tool against the test data
3. Verify output correctness
4. Clean up test data

See [test/e2e/README.md](test/e2e/README.md) for detailed documentation.

### All Tests

```bash
npm run test:all
```

Runs both unit and e2e tests.

### Manual Test Data Management

Load test data:
```bash
npm run load-test-data
```

Clean test data:
```bash
npm run clean-test-data
```

Query the loaded test data:
```bash
node src/index.js --ccd 1234567890123456
```
