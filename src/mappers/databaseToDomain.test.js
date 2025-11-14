import { describe, it, expect } from '@jest/globals';
import { mapDatabaseToDomain } from './databaseToDomain.js';
import { PaymentFeeLink } from '../models/database/PaymentFeeLink.js';
import { Fee as DbFee } from '../models/database/Fee.js';
import { Payment as DbPayment } from '../models/database/Payment.js';
import { Refund as DbRefund } from '../models/database/Refund.js';
import { Remission as DbRemission } from '../models/database/Remission.js';
import { Apportionment as DbApportionment } from '../models/database/Apportionment.js';

describe('databaseToDomain mapper', () => {
    it('should map a simple database structure to domain Case', () => {
        const link = new PaymentFeeLink();
        link.id = 1;
        link.payment_reference = 'RC-1234-5678-9012-3456';
        link.ccd_case_number = '1111111111111111';
        link.org_id = 'ORG123';
        link.enterprise_service_name = 'CMC';
        link.date_created = new Date('2024-01-01');
        link.date_updated = new Date('2024-01-02');

        const fee = new DbFee();
        fee.id = 1;
        fee.payment_link_id = 1;
        fee.code = 'FEE001';
        fee.version = '1';
        fee.fee_amount = 100;
        fee.volume = 1;
        fee.calculated_amount = 100;
        fee.net_amount = 100;
        fee.ccd_case_number = '1111111111111111';
        fee.date_created = new Date('2024-01-01');
        fee.date_updated = new Date('2024-01-02');

        const payment = new DbPayment();
        payment.id = 1;
        payment.payment_link_id = 1;
        payment.reference = 'PAY-001';
        payment.amount = 100;
        payment.currency = 'GBP';
        payment.payment_status = 'success';
        payment.payment_method = 'card';
        payment.ccd_case_number = '1111111111111111';
        payment.date_created = new Date('2024-01-01');
        payment.date_updated = new Date('2024-01-02');

        const dbEntities = {
            payment_fee_links: [link],
            fees: [fee],
            payments: [payment],
            refunds: [],
            remissions: [],
            apportionments: []
        };

        const result = mapDatabaseToDomain(dbEntities);

        expect(result.ccdCaseNumber).toBe('1111111111111111');
        expect(result.serviceRequests).toHaveLength(1);

        const sr = result.serviceRequests[0];
        expect(sr.paymentReference).toBe('RC-1234-5678-9012-3456');
        expect(sr.orgId).toBe('ORG123');
        expect(sr.serviceName).toBe('CMC');
        expect(sr.fees).toHaveLength(1);
        expect(sr.payments).toHaveLength(1);

        const domainFee = sr.fees[0];
        expect(domainFee.code).toBe('FEE001');
        expect(domainFee.version).toBe('1');
        expect(domainFee.amount).toBe(100);
        expect(domainFee.volume).toBe(1);

        const domainPayment = sr.payments[0];
        expect(domainPayment.reference).toBe('PAY-001');
        expect(domainPayment.amount).toBe(100);
        expect(domainPayment.currency).toBe('GBP');
        expect(domainPayment.status).toBe('success');
        expect(domainPayment.method).toBe('card');
    });

    it('should map fees with remissions', () => {
        const link = new PaymentFeeLink();
        link.id = 1;
        link.payment_reference = 'RC-1234-5678-9012-3456';
        link.ccd_case_number = '1111111111111111';

        const fee = new DbFee();
        fee.id = 1;
        fee.payment_link_id = 1;
        fee.code = 'FEE001';
        fee.version = '1';
        fee.fee_amount = 100;
        fee.volume = 1;
        fee.calculated_amount = 100;
        fee.net_amount = 50;
        fee.ccd_case_number = '1111111111111111';

        const remission = new DbRemission();
        remission.id = 1;
        remission.fee_id = 1;
        remission.hwf_reference = 'HWF-001';
        remission.hwf_amount = 50;
        remission.beneficiary_name = 'John Doe';
        remission.ccd_case_number = '1111111111111111';
        remission.date_created = new Date('2024-01-01');

        const dbEntities = {
            payment_fee_links: [link],
            fees: [fee],
            payments: [],
            refunds: [],
            remissions: [remission],
            apportionments: []
        };

        const result = mapDatabaseToDomain(dbEntities);

        const domainFee = result.serviceRequests[0].fees[0];
        expect(domainFee.remissions).toHaveLength(1);

        const domainRemission = domainFee.remissions[0];
        expect(domainRemission.hwfReference).toBe('HWF-001');
        expect(domainRemission.amount).toBe(50);
        expect(domainRemission.beneficiaryName).toBe('John Doe');
    });

    it('should map payments with refunds', () => {
        const link = new PaymentFeeLink();
        link.id = 1;
        link.payment_reference = 'RC-1234-5678-9012-3456';
        link.ccd_case_number = '1111111111111111';

        const payment = new DbPayment();
        payment.id = 1;
        payment.payment_link_id = 1;
        payment.reference = 'PAY-001';
        payment.amount = 100;
        payment.currency = 'GBP';
        payment.ccd_case_number = '1111111111111111';

        const refund = new DbRefund();
        refund.id = 1;
        refund.payment_reference = 'PAY-001';
        refund.reference = 'REF-001';
        refund.amount = 30;
        refund.reason = 'Overpayment';
        refund.refund_status = 'Approved';
        refund.refund_instruction_type = 'REFUND';
        refund.ccd_case_number = '1111111111111111';
        refund.date_created = new Date('2024-01-01');
        refund.created_by = 'user@example.com';

        const dbEntities = {
            payment_fee_links: [link],
            fees: [],
            payments: [payment],
            refunds: [refund],
            remissions: [],
            apportionments: []
        };

        const result = mapDatabaseToDomain(dbEntities);

        const domainPayment = result.serviceRequests[0].payments[0];
        expect(domainPayment.refunds).toHaveLength(1);

        const domainRefund = domainPayment.refunds[0];
        expect(domainRefund.reference).toBe('REF-001');
        expect(domainRefund.amount).toBe(30);
        expect(domainRefund.reason).toBe('Overpayment');
        expect(domainRefund.status).toBe('Approved');
        expect(domainRefund.instructionType).toBe('REFUND');
        expect(domainRefund.createdBy).toBe('user@example.com');
    });

    it('should map payments with fee allocations', () => {
        const link = new PaymentFeeLink();
        link.id = 1;
        link.payment_reference = 'RC-1234-5678-9012-3456';
        link.ccd_case_number = '1111111111111111';

        const fee1 = new DbFee();
        fee1.id = 1;
        fee1.payment_link_id = 1;
        fee1.code = 'FEE001';
        fee1.version = '1';
        fee1.fee_amount = 100;
        fee1.ccd_case_number = '1111111111111111';

        const fee2 = new DbFee();
        fee2.id = 2;
        fee2.payment_link_id = 1;
        fee2.code = 'FEE002';
        fee2.version = '1';
        fee2.fee_amount = 50;
        fee2.ccd_case_number = '1111111111111111';

        const payment = new DbPayment();
        payment.id = 1;
        payment.payment_link_id = 1;
        payment.reference = 'PAY-001';
        payment.amount = 150;
        payment.currency = 'GBP';
        payment.ccd_case_number = '1111111111111111';

        const apportion1 = new DbApportionment();
        apportion1.id = 1;
        apportion1.payment_id = 1;
        apportion1.fee_id = 1;
        apportion1.apportion_amount = 100;

        const apportion2 = new DbApportionment();
        apportion2.id = 2;
        apportion2.payment_id = 1;
        apportion2.fee_id = 2;
        apportion2.apportion_amount = 50;

        const dbEntities = {
            payment_fee_links: [link],
            fees: [fee1, fee2],
            payments: [payment],
            refunds: [],
            remissions: [],
            apportionments: [apportion1, apportion2]
        };

        const result = mapDatabaseToDomain(dbEntities);

        const domainPayment = result.serviceRequests[0].payments[0];
        expect(domainPayment.feeAllocations).toHaveLength(2);

        expect(domainPayment.feeAllocations[0].feeCode).toBe('FEE001');
        expect(domainPayment.feeAllocations[0].amount).toBe(100);

        expect(domainPayment.feeAllocations[1].feeCode).toBe('FEE002');
        expect(domainPayment.feeAllocations[1].amount).toBe(50);
    });

    it('should map multiple service requests', () => {
        const link1 = new PaymentFeeLink();
        link1.id = 1;
        link1.payment_reference = 'RC-1234-5678-9012-3456';
        link1.ccd_case_number = '1111111111111111';

        const link2 = new PaymentFeeLink();
        link2.id = 2;
        link2.payment_reference = 'RC-9999-8888-7777-6666';
        link2.ccd_case_number = '1111111111111111';

        const fee1 = new DbFee();
        fee1.id = 1;
        fee1.payment_link_id = 1;
        fee1.code = 'FEE001';
        fee1.version = '1';
        fee1.fee_amount = 100;
        fee1.ccd_case_number = '1111111111111111';

        const fee2 = new DbFee();
        fee2.id = 2;
        fee2.payment_link_id = 2;
        fee2.code = 'FEE002';
        fee2.version = '1';
        fee2.fee_amount = 200;
        fee2.ccd_case_number = '1111111111111111';

        const dbEntities = {
            payment_fee_links: [link1, link2],
            fees: [fee1, fee2],
            payments: [],
            refunds: [],
            remissions: [],
            apportionments: []
        };

        const result = mapDatabaseToDomain(dbEntities);

        expect(result.serviceRequests).toHaveLength(2);
        expect(result.serviceRequests[0].paymentReference).toBe('RC-1234-5678-9012-3456');
        expect(result.serviceRequests[0].fees).toHaveLength(1);
        expect(result.serviceRequests[0].fees[0].code).toBe('FEE001');

        expect(result.serviceRequests[1].paymentReference).toBe('RC-9999-8888-7777-6666');
        expect(result.serviceRequests[1].fees).toHaveLength(1);
        expect(result.serviceRequests[1].fees[0].code).toBe('FEE002');
    });

    it('should return array of Cases when multiple CCDs present', () => {
        const link1 = new PaymentFeeLink();
        link1.id = 1;
        link1.payment_reference = 'RC-1111-1111-1111-1111';
        link1.ccd_case_number = '1111111111111111';

        const link2 = new PaymentFeeLink();
        link2.id = 2;
        link2.payment_reference = 'RC-2222-2222-2222-2222';
        link2.ccd_case_number = '2222222222222222';

        const dbEntities = {
            payment_fee_links: [link1, link2],
            fees: [],
            payments: [],
            refunds: [],
            remissions: [],
            apportionments: []
        };

        const result = mapDatabaseToDomain(dbEntities);

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(2);
        expect(result[0].ccdCaseNumber).toBe('1111111111111111');
        expect(result[1].ccdCaseNumber).toBe('2222222222222222');
    });

    it('should handle empty database entities', () => {
        const dbEntities = {
            payment_fee_links: [],
            fees: [],
            payments: [],
            refunds: [],
            remissions: [],
            apportionments: []
        };

        const result = mapDatabaseToDomain(dbEntities);

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
    });

    it('should skip orphaned fees (no matching payment_fee_link)', () => {
        const link = new PaymentFeeLink();
        link.id = 1;
        link.payment_reference = 'RC-1234-5678-9012-3456';
        link.ccd_case_number = '1111111111111111';

        const fee = new DbFee();
        fee.id = 1;
        fee.payment_link_id = 999; // Non-existent link
        fee.code = 'FEE001';
        fee.version = '1';
        fee.fee_amount = 100;
        fee.ccd_case_number = '1111111111111111';

        const dbEntities = {
            payment_fee_links: [link],
            fees: [fee],
            payments: [],
            refunds: [],
            remissions: [],
            apportionments: []
        };

        const result = mapDatabaseToDomain(dbEntities);

        expect(result.serviceRequests).toHaveLength(1);
        expect(result.serviceRequests[0].fees).toHaveLength(0); // Orphaned fee skipped
    });

    it('should skip orphaned payments (no matching payment_fee_link)', () => {
        const link = new PaymentFeeLink();
        link.id = 1;
        link.payment_reference = 'RC-1234-5678-9012-3456';
        link.ccd_case_number = '1111111111111111';

        const payment = new DbPayment();
        payment.id = 1;
        payment.payment_link_id = 999; // Non-existent link
        payment.reference = 'PAY-001';
        payment.amount = 100;
        payment.ccd_case_number = '1111111111111111';

        const dbEntities = {
            payment_fee_links: [link],
            fees: [],
            payments: [payment],
            refunds: [],
            remissions: [],
            apportionments: []
        };

        const result = mapDatabaseToDomain(dbEntities);

        expect(result.serviceRequests).toHaveLength(1);
        expect(result.serviceRequests[0].payments).toHaveLength(0); // Orphaned payment skipped
    });
});
