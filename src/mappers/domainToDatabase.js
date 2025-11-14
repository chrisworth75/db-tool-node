/**
 * Maps from clean domain model to database model
 * Use this when preparing to persist data to the database
 */

import { PaymentFeeLink } from '../models/database/PaymentFeeLink.js';
import { Fee as DbFee } from '../models/database/Fee.js';
import { Payment as DbPayment } from '../models/database/Payment.js';
import { Refund as DbRefund } from '../models/database/Refund.js';
import { Remission as DbRemission } from '../models/database/Remission.js';
import { Apportionment as DbApportionment } from '../models/database/Apportionment.js';

/**
 * Map a domain Case to database structures
 * Returns arrays of database entities ready for persistence
 */
export function mapCaseToDatabase(domainCase) {
    const result = {
        payment_fee_links: [],
        fees: [],
        payments: [],
        refunds: [],
        remissions: [],
        apportionments: []
    };

    let linkId = 1;
    let feeId = 1;
    let paymentId = 1;
    let refundId = 1;
    let remissionId = 1;
    let apportionmentId = 1;

    domainCase.serviceRequests.forEach(sr => {
        // Create payment_fee_link
        const link = new PaymentFeeLink();
        link.id = linkId;
        link.payment_reference = sr.paymentReference;
        link.ccd_case_number = sr.ccdCaseNumber;
        link.case_reference = sr.caseReference;
        link.org_id = sr.orgId;
        link.enterprise_service_name = sr.serviceName;
        link.date_created = sr.createdAt || new Date();
        link.date_updated = sr.updatedAt || new Date();

        // Calculate amount_due
        const srSummary = sr.getSummary();
        link.amount_due = srSummary.amountDue;

        result.payment_fee_links.push(link);

        // Map fees
        sr.fees.forEach(domainFee => {
            const fee = new DbFee();
            fee.id = feeId;
            fee.payment_link_id = linkId;
            fee.code = domainFee.code;
            fee.version = domainFee.version;
            fee.fee_amount = domainFee.amount;
            fee.volume = domainFee.volume || 1;
            fee.calculated_amount = Number(domainFee.amount) * (domainFee.volume || 1);
            fee.net_amount = domainFee.getAmountAfterRemissions();
            fee.amount_due = fee.net_amount; // Simplified
            fee.ccd_case_number = sr.ccdCaseNumber;
            fee.reference = domainFee.reference;
            fee.date_created = domainFee.createdAt || new Date();
            fee.date_updated = domainFee.updatedAt || new Date();

            result.fees.push(fee);

            // Map remissions for this fee
            domainFee.remissions.forEach(domainRemission => {
                const remission = new DbRemission();
                remission.id = remissionId;
                remission.fee_id = feeId;
                remission.hwf_reference = domainRemission.hwfReference;
                remission.hwf_amount = domainRemission.amount;
                remission.beneficiary_name = domainRemission.beneficiaryName;
                remission.ccd_case_number = sr.ccdCaseNumber;
                remission.date_created = domainRemission.createdAt || new Date();
                remission.date_updated = domainRemission.updatedAt || new Date();

                result.remissions.push(remission);
                remissionId++;
            });

            feeId++;
        });

        // Map payments
        sr.payments.forEach(domainPayment => {
            const payment = new DbPayment();
            payment.id = paymentId;
            payment.payment_link_id = linkId;
            payment.reference = domainPayment.reference;
            payment.amount = domainPayment.amount;
            payment.currency = domainPayment.currency || 'GBP';
            payment.payment_status = domainPayment.status;
            payment.payment_method = domainPayment.method;
            payment.payment_provider = domainPayment.provider;
            payment.payment_channel = domainPayment.channel;
            payment.customer_reference = domainPayment.customerReference;
            payment.pba_number = domainPayment.pbaNumber;
            payment.payer_name = domainPayment.payerName;
            payment.ccd_case_number = sr.ccdCaseNumber;
            payment.date_created = domainPayment.createdAt || new Date();
            payment.date_updated = domainPayment.updatedAt || new Date();
            payment.banked_date = domainPayment.bankedAt;

            result.payments.push(payment);

            // Map refunds for this payment
            domainPayment.refunds.forEach(domainRefund => {
                const refund = new DbRefund();
                refund.id = refundId;
                refund.reference = domainRefund.reference;
                refund.amount = domainRefund.amount;
                refund.reason = domainRefund.reason;
                refund.refund_status = domainRefund.status;
                refund.refund_instruction_type = domainRefund.instructionType;
                refund.payment_reference = domainPayment.reference;
                refund.ccd_case_number = sr.ccdCaseNumber;
                refund.date_created = domainRefund.createdAt || new Date();
                refund.date_updated = domainRefund.updatedAt || new Date();
                refund.created_by = domainRefund.createdBy;
                refund.updated_by = domainRefund.updatedBy;

                result.refunds.push(refund);
                refundId++;
            });

            // Map apportionments for this payment
            domainPayment.feeAllocations.forEach(allocation => {
                // Find the fee by code to get the fee_id
                const matchingFee = result.fees.find(f => f.code === allocation.feeCode);

                if (matchingFee) {
                    const apportionment = new DbApportionment();
                    apportionment.id = apportionmentId;
                    apportionment.payment_id = paymentId;
                    apportionment.fee_id = matchingFee.id;
                    apportionment.payment_link_id = linkId;
                    apportionment.apportion_amount = allocation.amount;
                    apportionment.amount = allocation.amount; // Legacy field
                    apportionment.ccd_case_number = sr.ccdCaseNumber;
                    apportionment.date_created = new Date();
                    apportionment.date_updated = new Date();

                    result.apportionments.push(apportionment);
                    apportionmentId++;
                }
            });

            paymentId++;
        });

        linkId++;
    });

    return result;
}

/**
 * Validate all database entities before persistence
 */
export function validateDatabaseEntities(dbEntities) {
    const validationResults = {
        payment_fee_links: [],
        fees: [],
        payments: [],
        refunds: [],
        remissions: [],
        apportionments: [],
        isValid: true
    };

    // Validate payment_fee_links
    dbEntities.payment_fee_links.forEach((link, index) => {
        const result = link.validate();
        if (!result.isValid()) {
            validationResults.isValid = false;
        }
        validationResults.payment_fee_links.push({
            index,
            id: link.id,
            result
        });
    });

    // Validate fees
    dbEntities.fees.forEach((fee, index) => {
        const result = fee.validate();
        if (!result.isValid()) {
            validationResults.isValid = false;
        }
        validationResults.fees.push({
            index,
            id: fee.id,
            result
        });
    });

    // Validate payments
    dbEntities.payments.forEach((payment, index) => {
        const result = payment.validate();
        if (!result.isValid()) {
            validationResults.isValid = false;
        }
        validationResults.payments.push({
            index,
            id: payment.id,
            result
        });
    });

    // Validate refunds
    dbEntities.refunds.forEach((refund, index) => {
        const result = refund.validate();
        if (!result.isValid()) {
            validationResults.isValid = false;
        }
        validationResults.refunds.push({
            index,
            id: refund.id,
            result
        });
    });

    // Validate remissions
    dbEntities.remissions.forEach((remission, index) => {
        const result = remission.validate();
        if (!result.isValid()) {
            validationResults.isValid = false;
        }
        validationResults.remissions.push({
            index,
            id: remission.id,
            result
        });
    });

    // Validate apportionments
    dbEntities.apportionments.forEach((apportionment, index) => {
        const result = apportionment.validate();
        if (!result.isValid()) {
            validationResults.isValid = false;
        }
        validationResults.apportionments.push({
            index,
            id: apportionment.id,
            result
        });
    });

    return validationResults;
}
