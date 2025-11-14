/**
 * DATABASE MODEL - payment table
 */

import { FieldConstraints, validateField, ValidationResult, PaymentStatus, PaymentMethod, PaymentChannel } from './validators.js';

export class Payment {
    constructor() {
        this.id = null;
        this.amount = null;
        this.case_reference = null;
        this.ccd_case_number = null;
        this.currency = 'GBP';
        this.date_created = null;
        this.date_updated = null;
        this.description = null;
        this.service_type = null;
        this.site_id = null;
        this.user_id = null;
        this.payment_channel = null;
        this.payment_method = null;
        this.payment_provider = null;
        this.payment_status = null;
        this.payment_link_id = null;
        this.customer_reference = null;
        this.external_reference = null;
        this.organisation_name = null;
        this.pba_number = null;
        this.reference = null;
        this.giro_slip_no = null;
        this.s2s_service_name = null;
        this.reported_date_offline = null;
        this.service_callback_url = null;
        this.document_control_number = null;
        this.banked_date = null;
        this.payer_name = null;
        this.internal_reference = null;
    }

    static constraints = {
        id: FieldConstraints.notNull(),
        amount: FieldConstraints.notNull().positiveNumber(),
        ccd_case_number: FieldConstraints.notNull().maxLength(25),
        currency: FieldConstraints.notNull().maxLength(3),
        date_created: FieldConstraints.notNull(),
        date_updated: FieldConstraints.notNull(),
        payment_channel: FieldConstraints.nullable().enum(Object.values(PaymentChannel)),
        payment_method: FieldConstraints.nullable().enum(Object.values(PaymentMethod)),
        payment_status: FieldConstraints.nullable().enum(Object.values(PaymentStatus)),
        payment_link_id: FieldConstraints.notNull(),
        reference: FieldConstraints.notNull().maxLength(50)
    };

    validate() {
        const result = new ValidationResult();

        for (const [field, constraints] of Object.entries(Payment.constraints)) {
            const errors = validateField(field, this[field], constraints);
            errors.forEach(err => result.addError(field, err));
        }

        // Custom validation: if PBA method, pba_number should be present
        if (this.payment_method === PaymentMethod.PBA && !this.pba_number) {
            result.addWarning('pba_number', 'PBA number expected when payment method is "payment by account"');
        }

        return result;
    }
}
