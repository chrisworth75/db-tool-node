import { describe, it, expect } from '@jest/globals';
import { PaymentFeeLink } from './PaymentFeeLink.js';
import { Fee } from './Fee.js';
import { Payment } from './Payment.js';
import { Refund } from './Refund.js';
import { Remission } from './Remission.js';
import { Apportionment } from './Apportionment.js';

describe('Database Models Validation', () => {
    describe('PaymentFeeLink', () => {
        it('should validate successfully with valid data', () => {
            const link = new PaymentFeeLink();
            link.id = 1;
            link.payment_reference = 'RC-1234';
            link.ccd_case_number = '1111111111111111';
            link.date_created = new Date();
            link.date_updated = new Date();

            const result = link.validate();
            expect(result.isValid()).toBe(true);
        });

        it('should fail validation with missing required fields', () => {
            const link = new PaymentFeeLink();
            const result = link.validate();
            expect(result.isValid()).toBe(false);
        });

        it('should validate amount_due calculation', () => {
            const link = new PaymentFeeLink();
            link.amount_due = 50;

            const fees = [
                { fee_amount: 100 },
                { fee_amount: 50 }
            ];
            const payments = [{ amount: 80 }];
            const remissions = [{ hwf_amount: 20 }];

            // Expected: 150 - 80 - 20 = 50
            const result = link.validateAmountDue(fees, payments, remissions);
            expect(result.isValid()).toBe(true);
        });

        it('should detect amount_due mismatch', () => {
            const link = new PaymentFeeLink();
            link.amount_due = 100; // Wrong!

            const fees = [{ fee_amount: 100 }];
            const payments = [{ amount: 50 }];
            const remissions = [];

            // Expected: 100 - 50 = 50, but we set it to 100
            const result = link.validateAmountDue(fees, payments, remissions);
            expect(result.isValid()).toBe(false);
        });
    });

    describe('Fee', () => {
        it('should validate successfully with valid data', () => {
            const fee = new Fee();
            fee.id = 1;
            fee.code = 'FEE001';
            fee.version = '1';
            fee.payment_link_id = 1;
            fee.calculated_amount = 100;
            fee.volume = 1;
            fee.ccd_case_number = '1111111111111111';
            fee.net_amount = 100;
            fee.fee_amount = 100;
            fee.amount_due = 100;
            fee.date_created = new Date();
            fee.date_updated = new Date();

            const result = fee.validate();
            expect(result.isValid()).toBe(true);
        });

        it('should warn if calculated_amount does not match fee_amount * volume', () => {
            const fee = new Fee();
            fee.id = 1;
            fee.code = 'FEE001';
            fee.version = '1';
            fee.payment_link_id = 1;
            fee.calculated_amount = 100; // Wrong!
            fee.volume = 2;
            fee.fee_amount = 75; // Should be 150
            fee.ccd_case_number = '1111111111111111';
            fee.net_amount = 100;
            fee.amount_due = 100;
            fee.date_created = new Date();
            fee.date_updated = new Date();

            const result = fee.validate();
            expect(result.hasWarnings()).toBe(true);
        });
    });

    describe('Payment', () => {
        it('should validate successfully with valid data', () => {
            const payment = new Payment();
            payment.id = 1;
            payment.amount = 100;
            payment.ccd_case_number = '1111111111111111';
            payment.currency = 'GBP';
            payment.date_created = new Date();
            payment.date_updated = new Date();
            payment.payment_link_id = 1;
            payment.reference = 'PAY-001';

            const result = payment.validate();
            expect(result.isValid()).toBe(true);
        });

        it('should warn if PBA method without pba_number', () => {
            const payment = new Payment();
            payment.id = 1;
            payment.amount = 100;
            payment.ccd_case_number = '1111111111111111';
            payment.currency = 'GBP';
            payment.date_created = new Date();
            payment.date_updated = new Date();
            payment.payment_link_id = 1;
            payment.reference = 'PAY-001';
            payment.payment_method = 'payment by account'; // PBA
            payment.pba_number = null; // Missing!

            const result = payment.validate();
            expect(result.hasWarnings()).toBe(true);
        });
    });

    describe('Refund', () => {
        it('should validate successfully with valid data', () => {
            const refund = new Refund();
            refund.id = 1;
            refund.amount = 50;
            refund.refund_status = 'Approved';

            const result = refund.validate();
            expect(result.isValid()).toBe(true);
        });

        it('should validate refund amount against payment', () => {
            const refund = new Refund();
            refund.amount = 50;

            const payment = { amount: 100 };
            const result = refund.validateAmount(payment);
            expect(result.isValid()).toBe(true);
        });

        it('should detect refund exceeding payment amount', () => {
            const refund = new Refund();
            refund.amount = 150; // Too much!

            const payment = { amount: 100 };
            const result = refund.validateAmount(payment);
            expect(result.isValid()).toBe(false);
        });
    });

    describe('Remission', () => {
        it('should validate successfully with valid data', () => {
            const remission = new Remission();
            remission.id = 1;
            remission.fee_id = 1;
            remission.hwf_amount = 50;

            const result = remission.validate();
            expect(result.isValid()).toBe(true);
        });

        it('should validate remission amount against fee', () => {
            const remission = new Remission();
            remission.hwf_amount = 50;

            const fee = { calculated_amount: 100 };
            const result = remission.validateAmount(fee);
            expect(result.isValid()).toBe(true);
        });

        it('should detect remission exceeding fee amount', () => {
            const remission = new Remission();
            remission.hwf_amount = 150; // Too much!

            const fee = { calculated_amount: 100 };
            const result = remission.validateAmount(fee);
            expect(result.isValid()).toBe(false);
        });
    });

    describe('Apportionment', () => {
        it('should validate successfully with valid data', () => {
            const apportion = new Apportionment();
            apportion.id = 1;
            apportion.payment_id = 1;
            apportion.fee_id = 1;
            apportion.apportion_amount = 50;

            const result = apportion.validate();
            expect(result.isValid()).toBe(true);
        });

        it('should warn if apportionment exceeds payment amount', () => {
            const apportion = new Apportionment();
            apportion.apportion_amount = 150;

            const payment = { amount: 100 };
            const fee = { calculated_amount: 200 };
            const result = apportion.validateAmount(payment, fee);
            expect(result.hasWarnings()).toBe(true);
        });

        it('should warn if apportionment exceeds fee amount', () => {
            const apportion = new Apportionment();
            apportion.apportion_amount = 150;

            const payment = { amount: 200 };
            const fee = { calculated_amount: 100 };
            const result = apportion.validateAmount(payment, fee);
            expect(result.hasWarnings()).toBe(true);
        });
    });
});
