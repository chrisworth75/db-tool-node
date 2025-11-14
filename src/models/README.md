# Case Domain Model

This directory contains the domain transfer object (DTO) for representing a case in a clean, business-focused structure without reflecting the database schema.

## Overview

The Case model transforms complex database relationships into a simple, hierarchical structure:

```
Case
├── Service Requests (SRs) - one or more per case
    ├── Fees
    │   └── Remissions (Help with Fees)
    └── Payments
        ├── Refunds
        ├── Status History
        └── Apportionments
```

## Core Classes

### Case
Represents a legal case identified by a CCD case number.

**Key Properties:**
- `ccdCaseNumber` - The CCD case identifier
- `serviceRequests[]` - Array of Service Request objects

**Methods:**
- `addServiceRequest(sr)` - Add a service request to the case
- `getSummary()` - Get aggregated totals and counts across all SRs

### ServiceRequest (SR)
Represents a payment_fee_link - a request for payment of fees.

**Key Properties:**
- `id` - Service request ID
- `paymentReference` - Payment reference (RC number)
- `fees[]` - Fees associated with this SR
- `payments[]` - Payments made for this SR

**Methods:**
- `addFee(fee)` - Add a fee
- `addPayment(payment)` - Add a payment
- `getAllRefunds()` - Get all refunds across all payments
- `getSummary()` - Get totals for this SR

### Fee
Represents a fee charged for a service.

**Key Properties:**
- `id`, `code`, `version` - Fee identification
- `amount` - Fee amount
- `remissions[]` - Help with Fees remissions applied

**Methods:**
- `addRemission(remission)` - Add a remission

### Payment
Represents a payment made against fees.

**Key Properties:**
- `id`, `reference` - Payment identification
- `amount` - Payment amount
- `status`, `method`, `provider` - Payment details
- `refunds[]` - Refunds for this payment
- `statusHistory[]` - Status change history
- `apportionments[]` - How payment is distributed to fees

**Methods:**
- `addRefund(refund)` - Add a refund
- `addStatusHistory(status)` - Add status history entry
- `addApportionment(apportionment)` - Add apportionment

### Refund
Represents a refund of a payment.

**Key Properties:**
- `id`, `reference` - Refund identification
- `amount` - Refund amount
- `reason`, `status` - Refund details
- `paymentReference` - Links to original payment
- `statusHistory[]` - Status change history
- `fees[]` - RefundFee objects

**Methods:**
- `addStatusHistory(status)` - Add status history
- `addFee(fee)` - Add refund fee

### Supporting Classes

- **Remission** - Help with Fees (HWF) assistance
- **PaymentStatusHistory** - Payment status changes
- **RefundStatusHistory** - Refund status changes
- **Apportionment** - Payment allocation to fees
- **RefundFee** - Refund to fee relationships

## Usage Example

```javascript
import { transformToCase } from '../services/caseTransformer.js';

// Fetch data from databases
const paymentData = await getAllPaymentDataByCCD('12345');
const refundData = await getAllRefundDataByCCD('12345');

// Transform to Case DTO
const caseObj = transformToCase(paymentData, refundData);

// Access structured data
console.log(`Case: ${caseObj.ccdCaseNumber}`);
console.log(`Service Requests: ${caseObj.serviceRequests.length}`);

// Get summary
const summary = caseObj.getSummary();
console.log(`Total Fees: £${summary.totalFees}`);
console.log(`Total Payments: £${summary.totalPayments}`);
console.log(`Total Refunds: £${summary.totalRefunds}`);
console.log(`Net Amount: £${summary.netAmount}`);
```

## Summary Calculations

### Case Summary
- `totalFees` - Sum of all fee amounts across all SRs
- `totalPayments` - Sum of all payment amounts
- `totalRefunds` - Sum of all refund amounts
- `totalRemissions` - Sum of all HWF remissions
- `netAmount` - Payments + Remissions - Refunds
- `amountDue` - Fees - Payments - Remissions
- Counts for SRs, fees, payments, refunds, remissions

### SR Summary
Same structure but scoped to a single service request.

## Benefits

1. **Database Independence** - No database column names or foreign keys
2. **Business Domain Focus** - Structure matches business concepts
3. **Easy Navigation** - Follow relationships naturally
4. **Type Safety** - All objects are proper class instances
5. **Calculated Summaries** - Built-in aggregation methods
6. **Clean JSON** - Serializes cleanly for APIs

## Transformation

The `caseTransformer.js` service handles mapping from database structure to Case DTO:
- Groups payment_fee_links by CCD
- Attaches fees and payments to correct SRs
- Links refunds to their payments via payment_reference
- Builds complete object graph with all relationships
