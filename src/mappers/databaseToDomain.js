/**
 * Maps from database model to clean domain model
 * Use this when reading from the database and presenting to users
 */

import {
    Case,
    ServiceRequest,
    Fee,
    Payment,
    Refund,
    Remission
} from '../models/domain/Case.js';

/**
 * Map database entities to domain Case(s)
 * @param {Object} dbEntities - Object containing arrays of database entities
 * @returns {Case|Case[]} Single Case or array of Cases
 */
export function mapDatabaseToDomain(dbEntities) {
    const {
        payment_fee_links,
        fees,
        payments,
        refunds,
        remissions,
        apportionments
    } = dbEntities;

    // Group by CCD case number
    const caseMap = new Map();

    payment_fee_links.forEach(link => {
        const ccd = link.ccd_case_number;

        if (!caseMap.has(ccd)) {
            const domainCase = new Case(ccd);
            caseMap.set(ccd, domainCase);
        }

        const domainCase = caseMap.get(ccd);
        const sr = new ServiceRequest(link.payment_reference, ccd);
        sr.caseReference = link.case_reference;
        sr.orgId = link.org_id;
        sr.serviceName = link.enterprise_service_name;
        sr.createdAt = link.date_created;
        sr.updatedAt = link.date_updated;

        domainCase.addServiceRequest(sr);
    });

    // Add fees to service requests
    fees.forEach(dbFee => {
        const domainCase = findCaseByCCD(caseMap, dbFee.ccd_case_number);
        if (!domainCase) return;

        const sr = findServiceRequestByLinkId(domainCase, dbFee.payment_link_id, payment_fee_links);
        if (!sr) return;

        const fee = new Fee(dbFee.code, dbFee.version, dbFee.fee_amount);
        fee.volume = dbFee.volume;
        fee.reference = dbFee.reference;
        fee.createdAt = dbFee.date_created;
        fee.updatedAt = dbFee.date_updated;

        sr.addFee(fee);

        // Add remissions for this fee
        const feeRemissions = remissions.filter(r => r.fee_id === dbFee.id);
        feeRemissions.forEach(dbRemission => {
            const remission = new Remission(dbRemission.hwf_reference, dbRemission.hwf_amount);
            remission.beneficiaryName = dbRemission.beneficiary_name;
            remission.createdAt = dbRemission.date_created;
            remission.updatedAt = dbRemission.date_updated;

            fee.addRemission(remission);
        });
    });

    // Add payments to service requests
    payments.forEach(dbPayment => {
        const domainCase = findCaseByCCD(caseMap, dbPayment.ccd_case_number);
        if (!domainCase) return;

        const sr = findServiceRequestByLinkId(domainCase, dbPayment.payment_link_id, payment_fee_links);
        if (!sr) return;

        const payment = new Payment(dbPayment.reference, dbPayment.amount);
        payment.currency = dbPayment.currency;
        payment.status = dbPayment.payment_status;
        payment.method = dbPayment.payment_method;
        payment.provider = dbPayment.payment_provider;
        payment.channel = dbPayment.payment_channel;
        payment.customerReference = dbPayment.customer_reference;
        payment.pbaNumber = dbPayment.pba_number;
        payment.payerName = dbPayment.payer_name;
        payment.createdAt = dbPayment.date_created;
        payment.updatedAt = dbPayment.date_updated;
        payment.bankedAt = dbPayment.banked_date;

        // Add fee allocations (apportionments) for this payment
        const paymentApportionments = apportionments.filter(a => a.payment_id === dbPayment.id);
        paymentApportionments.forEach(dbApportionment => {
            // Find the fee by id to get the fee code
            const matchingFee = fees.find(f => f.id === dbApportionment.fee_id);
            if (matchingFee) {
                payment.addFeeAllocation(matchingFee.code, dbApportionment.apportion_amount);
            }
        });

        sr.addPayment(payment);

        // Add refunds for this payment
        const paymentRefunds = refunds.filter(r => r.payment_reference === dbPayment.reference);
        paymentRefunds.forEach(dbRefund => {
            const refund = new Refund(dbRefund.reference, dbRefund.amount, dbRefund.reason);
            refund.status = dbRefund.refund_status;
            refund.instructionType = dbRefund.refund_instruction_type;
            refund.createdAt = dbRefund.date_created;
            refund.updatedAt = dbRefund.date_updated;
            refund.createdBy = dbRefund.created_by;
            refund.updatedBy = dbRefund.updated_by;

            payment.addRefund(refund);
        });
    });

    // Return single Case or array of Cases
    const cases = Array.from(caseMap.values());
    return cases.length === 1 ? cases[0] : cases;
}

/**
 * Find a case by CCD number in the case map
 */
function findCaseByCCD(caseMap, ccd) {
    return caseMap.get(ccd);
}

/**
 * Find a service request by payment_link_id
 */
function findServiceRequestByLinkId(domainCase, linkId, payment_fee_links) {
    // Find the link by id to get the payment_reference
    const link = payment_fee_links.find(l => l.id === linkId);
    if (!link) return null;

    // Find the SR by payment_reference
    return domainCase.serviceRequests.find(sr => sr.paymentReference === link.payment_reference);
}
