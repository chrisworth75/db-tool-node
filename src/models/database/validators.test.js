import { describe, it, expect } from '@jest/globals';
import {
    FieldConstraints,
    ValidationResult,
    validateField,
    PaymentStatus,
    RefundStatus,
    PaymentMethod,
    PaymentChannel
} from './validators.js';

describe('ValidationResult', () => {
    it('should start valid with no errors', () => {
        const result = new ValidationResult();
        expect(result.isValid()).toBe(true);
        expect(result.hasWarnings()).toBe(false);
    });

    it('should become invalid when error added', () => {
        const result = new ValidationResult();
        result.addError('field1', 'Error message');
        expect(result.isValid()).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].field).toBe('field1');
        expect(result.errors[0].message).toBe('Error message');
    });

    it('should track warnings', () => {
        const result = new ValidationResult();
        result.addWarning('field1', 'Warning message');
        expect(result.isValid()).toBe(true); // Still valid
        expect(result.hasWarnings()).toBe(true);
        expect(result.warnings).toHaveLength(1);
    });
});

describe('FieldConstraints', () => {
    it('should create notNull constraint', () => {
        const c = FieldConstraints.notNull();
        expect(c.required).toBe(true);
        expect(c.nullable).toBe(false);
    });

    it('should create nullable constraint', () => {
        const c = FieldConstraints.nullable();
        expect(c.nullable).toBe(true);
    });

    it('should support method chaining', () => {
        const c = FieldConstraints.notNull().maxLength(50).positiveNumber();
        expect(c.required).toBe(true);
        expect(c.maxLengthValue).toBe(50);
        expect(c.minValue).toBe(0);
    });

    it('should support enum constraint', () => {
        const c = FieldConstraints.nullable().enum(['A', 'B', 'C']);
        expect(c.allowedValues).toEqual(['A', 'B', 'C']);
    });
});

describe('validateField', () => {
    it('should validate required fields', () => {
        const c = FieldConstraints.notNull();
        const errors = validateField('test', null, c);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('required');
    });

    it('should validate nullable fields', () => {
        const c = FieldConstraints.notNull();
        const errors = validateField('test', null, c);
        expect(errors).toHaveLength(1);
    });

    it('should validate max length', () => {
        const c = FieldConstraints.nullable().maxLength(5);
        const errors = validateField('test', 'toolong', c);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('at most 5');
    });

    it('should validate enum values', () => {
        const c = FieldConstraints.nullable().enum(['A', 'B', 'C']);
        const errors = validateField('test', 'D', c);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('must be one of');
    });

    it('should validate positive numbers', () => {
        const c = FieldConstraints.nullable().positiveNumber();
        const errors = validateField('test', -5, c);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('at least 0');
    });

    it('should allow null for nullable fields', () => {
        const c = FieldConstraints.nullable();
        const errors = validateField('test', null, c);
        expect(errors).toHaveLength(0);
    });

    it('should allow valid values', () => {
        const c = FieldConstraints.notNull().maxLength(10).positiveNumber();
        const errors = validateField('test', 5, c);
        expect(errors).toHaveLength(0);
    });
});

describe('Enums', () => {
    it('should have PaymentStatus values', () => {
        expect(PaymentStatus.INITIATED).toBe('initiated');
        expect(PaymentStatus.SUCCESS).toBe('success');
        expect(PaymentStatus.FAILED).toBe('failed');
        expect(PaymentStatus.PENDING).toBe('pending');
        expect(PaymentStatus.CANCELLED).toBe('cancelled');
    });

    it('should have RefundStatus values', () => {
        expect(RefundStatus.SENT_FOR_APPROVAL).toBe('Sent for approval');
        expect(RefundStatus.APPROVED).toBe('Approved');
        expect(RefundStatus.ACCEPTED).toBe('Accepted');
        expect(RefundStatus.REJECTED).toBe('Rejected');
    });

    it('should have PaymentMethod values', () => {
        expect(PaymentMethod.CARD).toBe('card');
        expect(PaymentMethod.PBA).toBe('payment by account');
        expect(PaymentMethod.CASH).toBe('cash');
    });

    it('should have PaymentChannel values', () => {
        expect(PaymentChannel.ONLINE).toBe('online');
        expect(PaymentChannel.TELEPHONY).toBe('telephony');
        expect(PaymentChannel.BULK_SCAN).toBe('bulk scan');
    });
});
