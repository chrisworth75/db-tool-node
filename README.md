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

```bash
npm test
```

100% code coverage required.

