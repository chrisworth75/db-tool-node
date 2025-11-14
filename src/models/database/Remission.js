/**
 * DATABASE MODEL - remission table
 */

import { FieldConstraints, validateField, ValidationResult } from './validators.js';

export class Remission {
    constructor() {
        this.id = null;
        this.fee_id = null;
        this.hwf_reference = null;
        this.hwf_amount = null;
        this.beneficiary_name = null;
        this.ccd_case_number = null;
        this.date_created = null;
        this.date_updated = null;
        this.remission_reference = null;
    }

    static constraints = {
        id: FieldConstraints.notNull(),
        fee_id: FieldConstraints.notNull(),
        hwf_amount: FieldConstraints.notNull().positiveNumber(),
        hwf_reference: FieldConstraints.nullable().maxLength(50),
        ccd_case_number: FieldConstraints.nullable().maxLength(25),
        date_created: FieldConstraints.nullable(),
        date_updated: FieldConstraints.nullable()
    };

    validate() {
        const result = new ValidationResult();

        for (const [field, constraints] of Object.entries(Remission.constraints)) {
            const errors = validateField(field, this[field], constraints);
            errors.forEach(err => result.addError(field, err));
        }

        return result;
    }

    /**
     * Validate remission amount does not exceed fee amount
     */
    validateAmount(fee) {
        const result = new ValidationResult();

        if (fee && this.hwf_amount) {
            const remissionAmount = Number(this.hwf_amount);
            const feeAmount = Number(fee.calculated_amount || 0);

            if (remissionAmount > feeAmount) {
                result.addError('hwf_amount',
                    `Remission amount (${remissionAmount}) cannot exceed fee amount (${feeAmount})`
                );
            }
        }

        return result;
    }
}
