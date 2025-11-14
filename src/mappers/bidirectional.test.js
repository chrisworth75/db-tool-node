import { describe, it, expect } from '@jest/globals';
import { mapCaseToDatabase } from './domainToDatabase.js';
import { mapDatabaseToDomain } from './databaseToDomain.js';
import { Case, ServiceRequest, Fee, Payment, Refund, Remission } from '../models/domain/Case.js';

describe('Bidirectional mapping (domain ↔ database)', () => {
    it('should successfully round-trip a simple case', () => {
        // Create a domain case
        const originalCase = new Case('1111111111111111');
        const sr = new ServiceRequest('RC-1234-5678-9012-3456', '1111111111111111');
        sr.orgId = 'ORG123';
        sr.serviceName = 'CMC';
        sr.caseReference = 'CASE-001';

        const fee = new Fee('FEE001', '1', 100);
        fee.volume = 1;
        fee.reference = 'FEE-REF-001';
        sr.addFee(fee);

        const payment = new Payment('PAY-001', 100);
        payment.currency = 'GBP';
        payment.status = 'success';
        payment.method = 'card';
        payment.provider = 'Gov Pay';
        payment.channel = 'online';
        sr.addPayment(payment);

        originalCase.addServiceRequest(sr);

        // Map to database
        const dbEntities = mapCaseToDatabase(originalCase);

        // Map back to domain
        const reconstitutedCase = mapDatabaseToDomain(dbEntities);

        // Verify the round-trip
        expect(reconstitutedCase.ccdCaseNumber).toBe(originalCase.ccdCaseNumber);
        expect(reconstitutedCase.serviceRequests).toHaveLength(1);

        const reconstitutedSr = reconstitutedCase.serviceRequests[0];
        expect(reconstitutedSr.paymentReference).toBe(sr.paymentReference);
        expect(reconstitutedSr.orgId).toBe(sr.orgId);
        expect(reconstitutedSr.serviceName).toBe(sr.serviceName);
        expect(reconstitutedSr.caseReference).toBe(sr.caseReference);

        expect(reconstitutedSr.fees).toHaveLength(1);
        const reconstitutedFee = reconstitutedSr.fees[0];
        expect(reconstitutedFee.code).toBe(fee.code);
        expect(reconstitutedFee.version).toBe(fee.version);
        expect(reconstitutedFee.amount).toBe(fee.amount);
        expect(reconstitutedFee.volume).toBe(fee.volume);
        expect(reconstitutedFee.reference).toBe(fee.reference);

        expect(reconstitutedSr.payments).toHaveLength(1);
        const reconstitutedPayment = reconstitutedSr.payments[0];
        expect(reconstitutedPayment.reference).toBe(payment.reference);
        expect(reconstitutedPayment.amount).toBe(payment.amount);
        expect(reconstitutedPayment.currency).toBe(payment.currency);
        expect(reconstitutedPayment.status).toBe(payment.status);
        expect(reconstitutedPayment.method).toBe(payment.method);
    });

    it('should round-trip a case with remissions', () => {
        const originalCase = new Case('1111111111111111');
        const sr = new ServiceRequest('RC-1234-5678-9012-3456', '1111111111111111');

        const fee = new Fee('FEE001', '1', 100);
        const remission = new Remission('HWF-001', 50);
        remission.beneficiaryName = 'John Doe';
        fee.addRemission(remission);
        sr.addFee(fee);

        originalCase.addServiceRequest(sr);

        // Round-trip
        const dbEntities = mapCaseToDatabase(originalCase);
        const reconstitutedCase = mapDatabaseToDomain(dbEntities);

        const reconstitutedFee = reconstitutedCase.serviceRequests[0].fees[0];
        expect(reconstitutedFee.remissions).toHaveLength(1);

        const reconstitutedRemission = reconstitutedFee.remissions[0];
        expect(reconstitutedRemission.hwfReference).toBe(remission.hwfReference);
        expect(reconstitutedRemission.amount).toBe(remission.amount);
        expect(reconstitutedRemission.beneficiaryName).toBe(remission.beneficiaryName);
    });

    it('should round-trip a case with refunds', () => {
        const originalCase = new Case('1111111111111111');
        const sr = new ServiceRequest('RC-1234-5678-9012-3456', '1111111111111111');

        const payment = new Payment('PAY-001', 100);
        const refund = new Refund('REF-001', 30, 'Overpayment');
        refund.status = 'Approved';
        refund.instructionType = 'REFUND';
        refund.createdBy = 'user@example.com';
        payment.addRefund(refund);
        sr.addPayment(payment);

        originalCase.addServiceRequest(sr);

        // Round-trip
        const dbEntities = mapCaseToDatabase(originalCase);
        const reconstitutedCase = mapDatabaseToDomain(dbEntities);

        const reconstitutedPayment = reconstitutedCase.serviceRequests[0].payments[0];
        expect(reconstitutedPayment.refunds).toHaveLength(1);

        const reconstitutedRefund = reconstitutedPayment.refunds[0];
        expect(reconstitutedRefund.reference).toBe(refund.reference);
        expect(reconstitutedRefund.amount).toBe(refund.amount);
        expect(reconstitutedRefund.reason).toBe(refund.reason);
        expect(reconstitutedRefund.status).toBe(refund.status);
        expect(reconstitutedRefund.instructionType).toBe(refund.instructionType);
        expect(reconstitutedRefund.createdBy).toBe(refund.createdBy);
    });

    it('should round-trip a case with fee allocations', () => {
        const originalCase = new Case('1111111111111111');
        const sr = new ServiceRequest('RC-1234-5678-9012-3456', '1111111111111111');

        const fee1 = new Fee('FEE001', '1', 100);
        const fee2 = new Fee('FEE002', '1', 50);
        sr.addFee(fee1);
        sr.addFee(fee2);

        const payment = new Payment('PAY-001', 150);
        payment.addFeeAllocation('FEE001', 100);
        payment.addFeeAllocation('FEE002', 50);
        sr.addPayment(payment);

        originalCase.addServiceRequest(sr);

        // Round-trip
        const dbEntities = mapCaseToDatabase(originalCase);
        const reconstitutedCase = mapDatabaseToDomain(dbEntities);

        const reconstitutedPayment = reconstitutedCase.serviceRequests[0].payments[0];
        expect(reconstitutedPayment.feeAllocations).toHaveLength(2);

        expect(reconstitutedPayment.feeAllocations[0].feeCode).toBe('FEE001');
        expect(reconstitutedPayment.feeAllocations[0].amount).toBe(100);

        expect(reconstitutedPayment.feeAllocations[1].feeCode).toBe('FEE002');
        expect(reconstitutedPayment.feeAllocations[1].amount).toBe(50);
    });

    it('should round-trip a complex case with multiple SRs', () => {
        const originalCase = new Case('1111111111111111');

        const sr1 = new ServiceRequest('RC-1111-1111-1111-1111', '1111111111111111');
        sr1.orgId = 'ORG1';
        const fee1 = new Fee('FEE001', '1', 100);
        const remission1 = new Remission('HWF-001', 20);
        fee1.addRemission(remission1);
        sr1.addFee(fee1);

        const payment1 = new Payment('PAY-001', 80);
        payment1.addFeeAllocation('FEE001', 80);
        sr1.addPayment(payment1);

        originalCase.addServiceRequest(sr1);

        const sr2 = new ServiceRequest('RC-2222-2222-2222-2222', '1111111111111111');
        sr2.orgId = 'ORG2';
        const fee2 = new Fee('FEE002', '1', 200);
        sr2.addFee(fee2);

        const payment2 = new Payment('PAY-002', 250);
        payment2.addFeeAllocation('FEE002', 200);
        const refund2 = new Refund('REF-002', 50, 'Overpayment');
        payment2.addRefund(refund2);
        sr2.addPayment(payment2);

        originalCase.addServiceRequest(sr2);

        // Round-trip
        const dbEntities = mapCaseToDatabase(originalCase);
        const reconstitutedCase = mapDatabaseToDomain(dbEntities);

        // Verify structure
        expect(reconstitutedCase.serviceRequests).toHaveLength(2);

        // Check first SR
        expect(reconstitutedCase.serviceRequests[0].fees).toHaveLength(1);
        expect(reconstitutedCase.serviceRequests[0].fees[0].remissions).toHaveLength(1);
        expect(reconstitutedCase.serviceRequests[0].payments).toHaveLength(1);
        expect(reconstitutedCase.serviceRequests[0].payments[0].feeAllocations).toHaveLength(1);

        // Check second SR
        expect(reconstitutedCase.serviceRequests[1].fees).toHaveLength(1);
        expect(reconstitutedCase.serviceRequests[1].payments).toHaveLength(1);
        expect(reconstitutedCase.serviceRequests[1].payments[0].refunds).toHaveLength(1);
        expect(reconstitutedCase.serviceRequests[1].payments[0].feeAllocations).toHaveLength(1);
    });

    it('should preserve calculation methods after round-trip', () => {
        const originalCase = new Case('1111111111111111');
        const sr = new ServiceRequest('RC-1234-5678-9012-3456', '1111111111111111');

        const fee = new Fee('FEE001', '1', 100);
        fee.volume = 2;
        const remission = new Remission('HWF-001', 50);
        fee.addRemission(remission);
        sr.addFee(fee);

        const payment = new Payment('PAY-001', 100);
        const refund = new Refund('REF-001', 30, 'Overpayment');
        payment.addRefund(refund);
        sr.addPayment(payment);

        originalCase.addServiceRequest(sr);

        // Calculate original summary
        const originalSummary = originalCase.getSummary();

        // Round-trip
        const dbEntities = mapCaseToDatabase(originalCase);
        const reconstitutedCase = mapDatabaseToDomain(dbEntities);

        // Calculate reconstituted summary
        const reconstitutedSummary = reconstitutedCase.getSummary();

        // Verify calculations match
        expect(reconstitutedSummary.totalFees).toBe(originalSummary.totalFees);
        expect(reconstitutedSummary.totalPayments).toBe(originalSummary.totalPayments);
        expect(reconstitutedSummary.totalRefunds).toBe(originalSummary.totalRefunds);
        expect(reconstitutedSummary.totalRemissions).toBe(originalSummary.totalRemissions);
        expect(reconstitutedSummary.amountDue).toBe(originalSummary.amountDue);
    });
});
