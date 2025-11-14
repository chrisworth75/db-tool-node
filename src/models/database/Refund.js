/**
 * DATABASE MODEL - refunds table
 */

import { FieldConstraints, validateField, ValidationResult, RefundStatus } from './validators.js';

export class Refund {
    constructor() {
        this.id = null;
        this.date_created = null;
        this.date_updated = null;
        this.amount = null;
        this.reason = null;
        this.refund_status = null;
        this.reference = null;
        this.payment_reference = null;
        this.created_by = null;
        this.updated_by = null;
        this.ccd_case_number = null;
        this.fee_ids = null;
        this.notification_sent_flag = null;
        this.contact_details = null;
        this.service_type = null;
        this.refund_instruction_type = null;
    }

    static constraints = {
        id: FieldConstraints.notNull(),
        date_created: FieldConstraints.nullable(),
        date_updated: FieldConstraints.nullable(),
        amount: FieldConstraints.nullable().positiveNumber(),
        refund_status: FieldConstraints.nullable().enum(Object.values(RefundStatus)),
        reference: FieldConstraints.nullable().maxLength(255),
        payment_reference: FieldConstraints.nullable().maxLength(255),
        ccd_case_number: FieldConstraints.nullable().maxLength(255)
    };

    validate() {
        const result = new ValidationResult();

        for (const [field, constraints] of Object.entries(Refund.constraints)) {
            const errors = validateField(field, this[field], constraints);
            errors.forEach(err => result.addError(field, err));
        }

        // Custom validation: refund amount should not exceed payment amount
        // (This would need the payment object passed in)

        return result;
    }

    /**
     * Validate refund amount does not exceed payment amount
     */
    validateAmount(payment) {
        const result = new ValidationResult();

        if (payment && this.amount) {
            const refundAmount = Number(this.amount);
            const paymentAmount = Number(payment.amount || 0);

            if (refundAmount > paymentAmount) {
                result.addError('amount',
                    `Refund amount (${refundAmount}) cannot exceed payment amount (${paymentAmount})`
                );
            }
        }

        return result;
    }
}
