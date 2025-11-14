# Database Schemas

This directory contains the database schemas for the ccpay payment and refund systems.

## Files

### payments-schema.sql
PostgreSQL schema for the payments database (port 5446)

**Tables:**
- `payment_fee_link` - Links payments to fees and case references
- `fee` - Fee details including codes, amounts, and case numbers
- `payment` - Payment transactions with provider details and status
- `fee_pay_apportion` - Apportionment of payments to fees
- `remission` - Help with Fees (HWF) remission data
- `status_history` - Payment status change history
- `payment_audit_history` - Audit trail for payment operations

**Source:** `/Users/chris/dev-feepay/payments-db/db-init.backup/01-schema.sql`

### refunds-schema.sql
PostgreSQL schema for the refunds database (port 5447)

**Tables:**
- `refunds` - Main refunds table with amount, reason, status, and contact details
- `status_history` - Tracks status changes for refunds
- `refund_reasons` - Lookup table for refund reason codes (37 standard reasons)
- `refund_status` - Lookup table for refund status values
- `rejection_reasons` - Lookup table for rejection reason codes
- `refund_fees` - Maps fees to refunds (many-to-many relationship)

**Source:** `/Users/chris/Desktop/ccpay-refunds-schema.sql` (generated from ccpay-refunds-app liquibase changelogs)

## Database Connection Details

### Payments Database
```javascript
{
  host: "localhost",
  port: 5446,
  user: "postgres",
  password: "postgres",
  database: "payments"
}
```

### Refunds Database
```javascript
{
  host: "localhost",
  port: 5447,
  user: "postgres",
  password: "postgres",
  database: "refunds"
}
```

## Usage

These schemas are reference documentation for the databases queried by this tool. They help understand:
- Table structures and relationships
- Column names and data types
- Foreign key constraints
- Available lookup values (refund reasons, statuses, etc.)

## Key Fields for Queries

Both databases link through the `ccd_case_number` field:
- **payments.payment.ccd_case_number** - Links to CCD case
- **refunds.refunds.ccd_case_number** - Links to CCD case

This allows the db-tool to query both databases and merge results by CCD case number.
