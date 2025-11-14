/**
 * DATABASE MODEL - fee_pay_apportion table
 */

import { FieldConstraints, validateField, ValidationResult } from './validators.js';

export class Apportionment {
    constructor() {
        this.id = null;
        this.payment_id = null;
        this.fee_id = null;
        this.amount = null;
        this.payment_link_id = null;
        this.fee_amount = null;
        this.payment_amount = null;
        this.ccd_case_number = null;
        this.date_created = null;
        this.date_updated = null;
        this.apportion_type = null;
        this.call_surplus_amount = null;
        this.apportion_amount = null;
    }

    static constraints = {
        id: FieldConstraints.notNull(),
        payment_id: FieldConstraints.notNull(),
        fee_id: FieldConstraints.notNull(),
        amount: FieldConstraints.nullable().positiveNumber(),
        payment_link_id: FieldConstraints.nullable(),
        ccd_case_number: FieldConstraints.nullable().maxLength(25),
        date_created: FieldConstraints.nullable(),
        date_updated: FieldConstraints.nullable(),
        apportion_amount: FieldConstraints.nullable().positiveNumber()
    };

    validate() {
        const result = new ValidationResult();

        for (const [field, constraints] of Object.entries(Apportionment.constraints)) {
            const errors = validateField(field, this[field], constraints);
            errors.forEach(err => result.addError(field, err));
        }

        return result;
    }

    /**
     * Validate apportionment amount does not exceed payment amount
     */
    validateAmount(payment, fee) {
        const result = new ValidationResult();

        if (payment && this.apportion_amount) {
            const apportionAmount = Number(this.apportion_amount);
            const paymentAmount = Number(payment.amount || 0);

            if (apportionAmount > paymentAmount) {
                result.addWarning('apportion_amount',
                    `Apportionment amount (${apportionAmount}) exceeds payment amount (${paymentAmount})`
                );
            }
        }

        if (fee && this.apportion_amount) {
            const apportionAmount = Number(this.apportion_amount);
            const feeAmount = Number(fee.calculated_amount || 0);

            if (apportionAmount > feeAmount) {
                result.addWarning('apportion_amount',
                    `Apportionment amount (${apportionAmount}) exceeds fee amount (${feeAmount})`
                );
            }
        }

        return result;
    }
}
