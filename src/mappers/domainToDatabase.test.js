import { describe, it, expect } from '@jest/globals';
import { mapCaseToDatabase, validateDatabaseEntities } from './domainToDatabase.js';
import { Case, ServiceRequest, Fee, Payment, Refund, Remission } from '../models/domain/Case.js';

describe('domainToDatabase mapper', () => {
    describe('mapCaseToDatabase', () => {
        it('should map a simple case with one SR, fee, and payment', () => {
            const domainCase = new Case('1111111111111111');
            const sr = new ServiceRequest('RC-1234-5678-9012-3456', '1111111111111111');
            sr.orgId = 'ORG123';
            sr.serviceName = 'CMC';
            sr.createdAt = new Date('2024-01-01');
            sr.updatedAt = new Date('2024-01-02');

            const fee = new Fee('FEE001', '1', 100);
            fee.volume = 1;
            fee.reference = 'FEE-REF-001';
            fee.createdAt = new Date('2024-01-01');
            fee.updatedAt = new Date('2024-01-02');
            sr.addFee(fee);

            const payment = new Payment('PAY-001', 100);
            payment.currency = 'GBP';
            payment.status = 'success';
            payment.method = 'card';
            payment.createdAt = new Date('2024-01-01');
            payment.updatedAt = new Date('2024-01-02');
            sr.addPayment(payment);

            domainCase.addServiceRequest(sr);

            const result = mapCaseToDatabase(domainCase);

            expect(result.payment_fee_links).toHaveLength(1);
            expect(result.fees).toHaveLength(1);
            expect(result.payments).toHaveLength(1);
            expect(result.refunds).toHaveLength(0);
            expect(result.remissions).toHaveLength(0);
            expect(result.apportionments).toHaveLength(0);

            // Check payment_fee_link
            const link = result.payment_fee_links[0];
            expect(link.id).toBe(1);
            expect(link.payment_reference).toBe('RC-1234-5678-9012-3456');
            expect(link.ccd_case_number).toBe('1111111111111111');
            expect(link.org_id).toBe('ORG123');
            expect(link.enterprise_service_name).toBe('CMC');
            expect(link.amount_due).toBe(0); // 100 fees - 100 payments

            // Check fee
            const dbFee = result.fees[0];
            expect(dbFee.id).toBe(1);
            expect(dbFee.payment_link_id).toBe(1);
            expect(dbFee.code).toBe('FEE001');
            expect(dbFee.version).toBe('1');
            expect(dbFee.fee_amount).toBe(100);
            expect(dbFee.volume).toBe(1);
            expect(dbFee.calculated_amount).toBe(100);
            expect(dbFee.net_amount).toBe(100);

            // Check payment
            const dbPayment = result.payments[0];
            expect(dbPayment.id).toBe(1);
            expect(dbPayment.payment_link_id).toBe(1);
            expect(dbPayment.reference).toBe('PAY-001');
            expect(dbPayment.amount).toBe(100);
            expect(dbPayment.currency).toBe('GBP');
            expect(dbPayment.payment_status).toBe('success');
            expect(dbPayment.payment_method).toBe('card');
        });

        it('should map fees with remissions', () => {
            const domainCase = new Case('1111111111111111');
            const sr = new ServiceRequest('RC-1234-5678-9012-3456', '1111111111111111');

            const fee = new Fee('FEE001', '1', 100);
            const remission = new Remission('HWF-001', 50);
            remission.beneficiaryName = 'John Doe';
            remission.createdAt = new Date('2024-01-01');
            fee.addRemission(remission);
            sr.addFee(fee);

            domainCase.addServiceRequest(sr);

            const result = mapCaseToDatabase(domainCase);

            expect(result.remissions).toHaveLength(1);
            const dbRemission = result.remissions[0];
            expect(dbRemission.id).toBe(1);
            expect(dbRemission.fee_id).toBe(1);
            expect(dbRemission.hwf_reference).toBe('HWF-001');
            expect(dbRemission.hwf_amount).toBe(50);
            expect(dbRemission.beneficiary_name).toBe('John Doe');
            expect(dbRemission.ccd_case_number).toBe('1111111111111111');

            // Fee net_amount should reflect remission
            const dbFee = result.fees[0];
            expect(dbFee.net_amount).toBe(50); // 100 - 50 remission
        });

        it('should map payments with refunds', () => {
            const domainCase = new Case('1111111111111111');
            const sr = new ServiceRequest('RC-1234-5678-9012-3456', '1111111111111111');

            const payment = new Payment('PAY-001', 100);
            const refund = new Refund('REF-001', 30, 'Overpayment');
            refund.status = 'Approved';
            refund.instructionType = 'REFUND';
            refund.createdAt = new Date('2024-01-01');
            refund.createdBy = 'user@example.com';
            payment.addRefund(refund);
            sr.addPayment(payment);

            domainCase.addServiceRequest(sr);

            const result = mapCaseToDatabase(domainCase);

            expect(result.refunds).toHaveLength(1);
            const dbRefund = result.refunds[0];
            expect(dbRefund.id).toBe(1);
            expect(dbRefund.reference).toBe('REF-001');
            expect(dbRefund.amount).toBe(30);
            expect(dbRefund.reason).toBe('Overpayment');
            expect(dbRefund.refund_status).toBe('Approved');
            expect(dbRefund.refund_instruction_type).toBe('REFUND');
            expect(dbRefund.payment_reference).toBe('PAY-001');
            expect(dbRefund.ccd_case_number).toBe('1111111111111111');
            expect(dbRefund.created_by).toBe('user@example.com');
        });

        it('should map payments with fee allocations', () => {
            const domainCase = new Case('1111111111111111');
            const sr = new ServiceRequest('RC-1234-5678-9012-3456', '1111111111111111');

            const fee1 = new Fee('FEE001', '1', 100);
            const fee2 = new Fee('FEE002', '1', 50);
            sr.addFee(fee1);
            sr.addFee(fee2);

            const payment = new Payment('PAY-001', 150);
            payment.addFeeAllocation('FEE001', 100);
            payment.addFeeAllocation('FEE002', 50);
            sr.addPayment(payment);

            domainCase.addServiceRequest(sr);

            const result = mapCaseToDatabase(domainCase);

            expect(result.apportionments).toHaveLength(2);

            const apportion1 = result.apportionments[0];
            expect(apportion1.id).toBe(1);
            expect(apportion1.payment_id).toBe(1);
            expect(apportion1.fee_id).toBe(1); // First fee
            expect(apportion1.apportion_amount).toBe(100);
            expect(apportion1.payment_link_id).toBe(1);
            expect(apportion1.ccd_case_number).toBe('1111111111111111');

            const apportion2 = result.apportionments[1];
            expect(apportion2.id).toBe(2);
            expect(apportion2.payment_id).toBe(1);
            expect(apportion2.fee_id).toBe(2); // Second fee
            expect(apportion2.apportion_amount).toBe(50);
        });

        it('should map multiple service requests', () => {
            const domainCase = new Case('1111111111111111');

            const sr1 = new ServiceRequest('RC-1234-5678-9012-3456', '1111111111111111');
            const fee1 = new Fee('FEE001', '1', 100);
            sr1.addFee(fee1);
            domainCase.addServiceRequest(sr1);

            const sr2 = new ServiceRequest('RC-9999-8888-7777-6666', '1111111111111111');
            const fee2 = new Fee('FEE002', '1', 200);
            sr2.addFee(fee2);
            domainCase.addServiceRequest(sr2);

            const result = mapCaseToDatabase(domainCase);

            expect(result.payment_fee_links).toHaveLength(2);
            expect(result.fees).toHaveLength(2);

            expect(result.payment_fee_links[0].id).toBe(1);
            expect(result.payment_fee_links[0].payment_reference).toBe('RC-1234-5678-9012-3456');
            expect(result.payment_fee_links[1].id).toBe(2);
            expect(result.payment_fee_links[1].payment_reference).toBe('RC-9999-8888-7777-6666');

            expect(result.fees[0].payment_link_id).toBe(1);
            expect(result.fees[1].payment_link_id).toBe(2);
        });

        it('should calculate amount_due correctly', () => {
            const domainCase = new Case('1111111111111111');
            const sr = new ServiceRequest('RC-1234-5678-9012-3456', '1111111111111111');

            const fee = new Fee('FEE001', '1', 100);
            fee.volume = 2; // Total: 200
            const remission = new Remission('HWF-001', 50);
            fee.addRemission(remission);
            sr.addFee(fee);

            const payment = new Payment('PAY-001', 100);
            sr.addPayment(payment);

            domainCase.addServiceRequest(sr);

            const result = mapCaseToDatabase(domainCase);

            const link = result.payment_fee_links[0];
            // amount_due = total fees - total payments - total remissions
            // = 200 - 100 - 50 = 50
            expect(link.amount_due).toBe(50);
        });

        it('should handle empty service request', () => {
            const domainCase = new Case('1111111111111111');
            const sr = new ServiceRequest('RC-1234-5678-9012-3456', '1111111111111111');
            domainCase.addServiceRequest(sr);

            const result = mapCaseToDatabase(domainCase);

            expect(result.payment_fee_links).toHaveLength(1);
            expect(result.fees).toHaveLength(0);
            expect(result.payments).toHaveLength(0);
            expect(result.refunds).toHaveLength(0);
            expect(result.remissions).toHaveLength(0);
            expect(result.apportionments).toHaveLength(0);
        });
    });

    describe('validateDatabaseEntities', () => {
        it('should validate all entities successfully', () => {
            const domainCase = new Case('1111111111111111');
            const sr = new ServiceRequest('RC-1234-5678-9012-3456', '1111111111111111');

            const fee = new Fee('FEE001', '1', 100);
            sr.addFee(fee);

            const payment = new Payment('PAY-001', 100);
            sr.addPayment(payment);

            domainCase.addServiceRequest(sr);

            const dbEntities = mapCaseToDatabase(domainCase);
            const validationResults = validateDatabaseEntities(dbEntities);

            expect(validationResults.isValid).toBe(true);
            expect(validationResults.payment_fee_links).toHaveLength(1);
            expect(validationResults.fees).toHaveLength(1);
            expect(validationResults.payments).toHaveLength(1);
            expect(validationResults.refunds).toHaveLength(0);
            expect(validationResults.remissions).toHaveLength(0);
            expect(validationResults.apportionments).toHaveLength(0);

            expect(validationResults.payment_fee_links[0].result.isValid()).toBe(true);
            expect(validationResults.fees[0].result.isValid()).toBe(true);
            expect(validationResults.payments[0].result.isValid()).toBe(true);
        });

        it('should detect validation errors', () => {
            const domainCase = new Case('1111111111111111');
            const sr = new ServiceRequest('RC-1234-5678-9012-3456', '1111111111111111');

            // Create a fee with invalid data
            const fee = new Fee(null, null, -100); // Invalid: null code, negative amount
            sr.addFee(fee);

            domainCase.addServiceRequest(sr);

            const dbEntities = mapCaseToDatabase(domainCase);
            const validationResults = validateDatabaseEntities(dbEntities);

            expect(validationResults.isValid).toBe(false);
            expect(validationResults.fees[0].result.isValid()).toBe(false);
            expect(validationResults.fees[0].result.errors.length).toBeGreaterThan(0);

            // Check that we have errors for code and version fields
            const fieldErrors = validationResults.fees[0].result.errors.map(e => e.field);
            expect(fieldErrors).toContain('code');
            expect(fieldErrors).toContain('version');
        });
    });
});
