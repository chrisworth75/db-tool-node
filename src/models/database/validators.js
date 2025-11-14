/**
 * Validation decorators and constraint definitions for database models
 */

export const PaymentStatus = {
    INITIATED: 'initiated',
    SUCCESS: 'success',
    FAILED: 'failed',
    PENDING: 'pending',
    CANCELLED: 'cancelled'
};

export const RefundStatus = {
    SENT_FOR_APPROVAL: 'Sent for approval',
    APPROVED: 'Approved',
    UPDATE_REQUIRED: 'Update required',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled'
};

export const PaymentMethod = {
    CARD: 'card',
    PBA: 'payment by account',
    CASH: 'cash',
    CHEQUE: 'cheque',
    POSTAL_ORDER: 'postal order'
};

export const PaymentChannel = {
    ONLINE: 'online',
    TELEPHONY: 'telephony',
    BULK_SCAN: 'bulk scan'
};

/**
 * Validation result
 */
export class ValidationResult {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    addError(field, message) {
        this.errors.push({ field, message });
    }

    addWarning(field, message) {
        this.warnings.push({ field, message });
    }

    isValid() {
        return this.errors.length === 0;
    }

    hasWarnings() {
        return this.warnings.length > 0;
    }
}

/**
 * Field validation constraints
 */
export class FieldConstraints {
    constructor() {
        this.required = false;
        this.nullable = true;
        this.allowedValues = null;
        this.minLength = null;
        this.maxLengthValue = null;
        this.pattern = null;
        this.minValue = null;
        this.maxValue = null;
    }

    static notNull() {
        const c = new FieldConstraints();
        c.required = true;
        c.nullable = false;
        return c;
    }

    static nullable() {
        const c = new FieldConstraints();
        c.nullable = true;
        return c;
    }

    // Instance methods for chaining
    enum(values) {
        this.allowedValues = values;
        return this;
    }

    positiveNumber() {
        this.minValue = 0;
        return this;
    }

    maxLength(length) {
        this.maxLengthValue = length;
        return this;
    }
}

/**
 * Validate a value against constraints
 */
export function validateField(fieldName, value, constraints) {
    const errors = [];

    if (constraints.required && (value === null || value === undefined)) {
        errors.push(`${fieldName} is required`);
        return errors;
    }

    if (!constraints.nullable && value === null) {
        errors.push(`${fieldName} cannot be null`);
    }

    if (value !== null && value !== undefined) {
        if (constraints.allowedValues && !constraints.allowedValues.includes(value)) {
            errors.push(`${fieldName} must be one of: ${constraints.allowedValues.join(', ')}`);
        }

        if (constraints.minLength !== null && typeof value === 'string' && value.length < constraints.minLength) {
            errors.push(`${fieldName} must be at least ${constraints.minLength} characters`);
        }

        if (constraints.maxLengthValue !== null && typeof value === 'string' && value.length > constraints.maxLengthValue) {
            errors.push(`${fieldName} must be at most ${constraints.maxLengthValue} characters`);
        }

        if (constraints.pattern !== null && typeof value === 'string' && !constraints.pattern.test(value)) {
            errors.push(`${fieldName} does not match required pattern`);
        }

        if (constraints.minValue !== null && typeof value === 'number' && value < constraints.minValue) {
            errors.push(`${fieldName} must be at least ${constraints.minValue}`);
        }

        if (constraints.maxValue !== null && typeof value === 'number' && value > constraints.maxValue) {
            errors.push(`${fieldName} must be at most ${constraints.maxValue}`);
        }
    }

    return errors;
}
