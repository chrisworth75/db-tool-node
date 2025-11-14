/**
 * DATABASE MODEL - payment_fee_link table
 *
 * This model exactly matches the database structure.
 * Use this for database operations and validation before persistence.
 */

import { FieldConstraints, validateField, ValidationResult } from './validators.js';

export class PaymentFeeLink {
    constructor() {
        this.id = null;
        this.date_created = null;
        this.date_updated = null;
        this.payment_reference = null;
        this.org_id = null;
        this.enterprise_service_name = null;
        this.ccd_case_number = null;
        this.case_reference = null;
        this.service_request_callback_url = null;
        this.amount_due = null; // Calculated field - must match sum of fees - payments - remissions
    }

    /**
     * Field constraints
     */
    static constraints = {
        id: FieldConstraints.notNull(),
        date_created: FieldConstraints.notNull(),
        date_updated: FieldConstraints.notNull(),
        payment_reference: FieldConstraints.notNull().maxLength(50),
        org_id: FieldConstraints.nullable().maxLength(20),
        enterprise_service_name: FieldConstraints.nullable().maxLength(255),
        ccd_case_number: FieldConstraints.notNull().maxLength(25),
        case_reference: FieldConstraints.nullable().maxLength(25),
        service_request_callback_url: FieldConstraints.nullable(),
        amount_due: FieldConstraints.nullable().positiveNumber()
    };

    /**
     * Validate this instance
     */
    validate() {
        const result = new ValidationResult();

        for (const [field, constraints] of Object.entries(PaymentFeeLink.constraints)) {
            const errors = validateField(field, this[field], constraints);
            errors.forEach(err => result.addError(field, err));
        }

        return result;
    }

    /**
     * Validate amount_due matches related fees, payments, and remissions
     * This requires the related entities to be provided
     */
    validateAmountDue(fees, payments, remissions) {
        const result = new ValidationResult();

        const totalFees = fees.reduce((sum, f) => sum + Number(f.fee_amount || 0), 0);
        const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const totalRemissions = remissions.reduce((sum, r) => sum + Number(r.hwf_amount || 0), 0);

        const calculatedAmountDue = totalFees - totalPayments - totalRemissions;
        const currentAmountDue = Number(this.amount_due || 0);

        const difference = Math.abs(calculatedAmountDue - currentAmountDue);
        if (difference > 0.01) { // Allow for rounding differences
            result.addError('amount_due',
                `amount_due (${currentAmountDue}) does not match calculated value (${calculatedAmountDue}). ` +
                `Fees: ${totalFees}, Payments: ${totalPayments}, Remissions: ${totalRemissions}`
            );
        }

        return result;
    }
}
