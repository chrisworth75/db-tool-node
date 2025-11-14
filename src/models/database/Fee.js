/**
 * DATABASE MODEL - fee table
 */

import { FieldConstraints, validateField, ValidationResult } from './validators.js';

export class Fee {
    constructor() {
        this.id = null;
        this.code = null;
        this.version = null;
        this.payment_link_id = null;
        this.calculated_amount = null;
        this.volume = 1;
        this.ccd_case_number = null;
        this.reference = null;
        this.net_amount = null;
        this.fee_amount = null;
        this.amount_due = null;
        this.date_created = null;
        this.date_updated = null;
    }

    static constraints = {
        id: FieldConstraints.notNull(),
        code: FieldConstraints.notNull().maxLength(20),
        version: FieldConstraints.notNull(),
        payment_link_id: FieldConstraints.notNull(),
        calculated_amount: FieldConstraints.notNull().positiveNumber(),
        volume: FieldConstraints.notNull().positiveNumber(),
        ccd_case_number: FieldConstraints.notNull().maxLength(25),
        net_amount: FieldConstraints.notNull().positiveNumber(),
        fee_amount: FieldConstraints.notNull().positiveNumber(),
        amount_due: FieldConstraints.notNull().positiveNumber(),
        date_created: FieldConstraints.notNull(),
        date_updated: FieldConstraints.notNull()
    };

    validate() {
        const result = new ValidationResult();

        for (const [field, constraints] of Object.entries(Fee.constraints)) {
            const errors = validateField(field, this[field], constraints);
            errors.forEach(err => result.addError(field, err));
        }

        // Custom validation: calculated_amount should equal fee_amount * volume
        if (this.calculated_amount && this.fee_amount && this.volume) {
            const expected = Number(this.fee_amount) * Number(this.volume);
            const actual = Number(this.calculated_amount);
            const difference = Math.abs(expected - actual);

            if (difference > 0.01) {
                result.addWarning('calculated_amount',
                    `calculated_amount (${actual}) should equal fee_amount (${this.fee_amount}) * volume (${this.volume}) = ${expected}`
                );
            }
        }

        return result;
    }
}
