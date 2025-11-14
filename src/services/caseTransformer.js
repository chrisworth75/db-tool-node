import {
    Case,
    ServiceRequest,
    Fee,
    Payment,
    Refund,
    Remission,
    PaymentStatusHistory,
    RefundStatusHistory,
    Apportionment,
    RefundFee
} from '../models/Case.js';

/**
 * Transforms raw database data into a Case domain object
 * @param {Object} paymentData - Raw payment data from database
 * @param {Object} refundData - Raw refund data from database
 * @returns {Case|Case[]} - Single Case or array of Cases if multiple CCDs found
 */
export function transformToCase(paymentData, refundData) {
    // Group payment_fee_links by CCD case number
    const caseMap = new Map();

    // Process payment_fee_links (service requests)
    paymentData.payment_fee_links.forEach(linkRow => {
        const ccdNumber = linkRow.ccd_case_number;

        if (!caseMap.has(ccdNumber)) {
            caseMap.set(ccdNumber, {
                case: new Case(ccdNumber),
                srMap: new Map() // Map of SR id to ServiceRequest object
            });
        }

        const { case: caseObj, srMap } = caseMap.get(ccdNumber);

        // Create ServiceRequest (SR) from payment_fee_link
        const sr = new ServiceRequest(
            linkRow.id,
            linkRow.payment_reference,
            linkRow.ccd_case_number,
            linkRow.case_reference
        );
        sr.dateCreated = linkRow.date_created;
        sr.dateUpdated = linkRow.date_updated;
        sr.orgId = linkRow.org_id;
        sr.enterpriseServiceName = linkRow.enterprise_service_name;
        sr.serviceRequestCallbackUrl = linkRow.service_request_callback_url;

        caseObj.addServiceRequest(sr);
        srMap.set(linkRow.id, sr);
    });

    // Process fees
    paymentData.fees.forEach(feeRow => {
        const ccdNumber = feeRow.ccd_case_number;
        const caseData = caseMap.get(ccdNumber);
        if (!caseData) return;

        const sr = caseData.srMap.get(feeRow.payment_link_id);
        if (!sr) return;

        const fee = new Fee(feeRow.id, feeRow.code, feeRow.version);
        fee.amount = feeRow.fee_amount;
        fee.calculatedAmount = feeRow.calculated_amount;
        fee.netAmount = feeRow.net_amount;
        fee.amountDue = feeRow.amount_due;
        fee.volume = feeRow.volume;
        fee.reference = feeRow.reference;
        fee.dateCreated = feeRow.date_created;
        fee.dateUpdated = feeRow.date_updated;

        sr.addFee(fee);
    });

    // Process remissions (Help with Fees)
    const feeMap = new Map();
    paymentData.fees.forEach(feeRow => {
        feeMap.set(feeRow.id, feeRow);
    });

    paymentData.remissions.forEach(remissionRow => {
        const feeRow = feeMap.get(remissionRow.fee_id);
        if (!feeRow) return;

        const ccdNumber = feeRow.ccd_case_number;
        const caseData = caseMap.get(ccdNumber);
        if (!caseData) return;

        const sr = caseData.srMap.get(remissionRow.payment_link_id);
        if (!sr) return;

        const fee = sr.fees.find(f => f.id === remissionRow.fee_id);
        if (!fee) return;

        const remission = new Remission(
            remissionRow.id,
            remissionRow.hwf_reference,
            remissionRow.hwf_amount
        );
        remission.beneficiaryName = remissionRow.beneficiary_name;
        remission.remissionReference = remissionRow.remission_reference;
        remission.dateCreated = remissionRow.date_created;
        remission.dateUpdated = remissionRow.date_updated;

        fee.addRemission(remission);
    });

    // Process payments
    const paymentMap = new Map();
    paymentData.payments.forEach(paymentRow => {
        const ccdNumber = paymentRow.ccd_case_number;
        const caseData = caseMap.get(ccdNumber);
        if (!caseData) return;

        const sr = caseData.srMap.get(paymentRow.payment_link_id);
        if (!sr) return;

        const payment = new Payment(
            paymentRow.id,
            paymentRow.reference,
            paymentRow.amount
        );
        payment.currency = paymentRow.currency;
        payment.status = paymentRow.payment_status;
        payment.method = paymentRow.payment_method;
        payment.provider = paymentRow.payment_provider;
        payment.channel = paymentRow.payment_channel;
        payment.externalReference = paymentRow.external_reference;
        payment.customerReference = paymentRow.customer_reference;
        payment.pbaNumber = paymentRow.pba_number;
        payment.payerName = paymentRow.payer_name;
        payment.dateCreated = paymentRow.date_created;
        payment.dateUpdated = paymentRow.date_updated;
        payment.bankedDate = paymentRow.banked_date;

        sr.addPayment(payment);
        paymentMap.set(paymentRow.id, payment);
    });

    // Process payment status history
    paymentData.payment_status_history.forEach(statusRow => {
        const payment = paymentMap.get(statusRow.payment_id);
        if (!payment) return;

        const status = new PaymentStatusHistory(statusRow.id, statusRow.status);
        status.externalStatus = statusRow.external_status;
        status.errorCode = statusRow.error_code;
        status.message = statusRow.message;
        status.dateCreated = statusRow.date_created;
        status.dateUpdated = statusRow.date_updated;

        payment.addStatusHistory(status);
    });

    // Process apportionments
    paymentData.apportionments.forEach(apportionRow => {
        const payment = paymentMap.get(apportionRow.payment_id);
        if (!payment) return;

        const apportionment = new Apportionment(
            apportionRow.id,
            apportionRow.fee_id,
            apportionRow.apportion_amount
        );
        apportionment.apportionType = apportionRow.apportion_type;
        apportionment.callSurplusAmount = apportionRow.call_surplus_amount;
        apportionment.dateCreated = apportionRow.date_created;
        apportionment.dateUpdated = apportionRow.date_updated;

        payment.addApportionment(apportionment);
    });

    // Process refunds and attach to payments
    const refundMap = new Map();
    refundData.refunds.forEach(refundRow => {
        const ccdNumber = refundRow.ccd_case_number;
        const caseData = caseMap.get(ccdNumber);
        if (!caseData) return;

        // Find the payment this refund relates to by payment_reference
        let targetPayment = null;
        for (const sr of caseData.case.serviceRequests) {
            targetPayment = sr.payments.find(p => p.reference === refundRow.payment_reference);
            if (targetPayment) break;
        }

        if (!targetPayment) return;

        const refund = new Refund(
            refundRow.id,
            refundRow.reference,
            refundRow.amount
        );
        refund.reason = refundRow.reason;
        refund.reasonCode = refundRow.reason; // Assuming reason contains the code
        refund.status = refundRow.refund_status;
        refund.refundInstructionType = refundRow.refund_instruction_type;
        refund.paymentReference = refundRow.payment_reference;
        refund.dateCreated = refundRow.date_created;
        refund.dateUpdated = refundRow.date_updated;
        refund.createdBy = refundRow.created_by;
        refund.updatedBy = refundRow.updated_by;

        targetPayment.addRefund(refund);
        refundMap.set(refundRow.id, refund);
    });

    // Process refund status history
    refundData.refund_status_history.forEach(statusRow => {
        const refund = refundMap.get(statusRow.refunds_id);
        if (!refund) return;

        const status = new RefundStatusHistory(statusRow.id, statusRow.status);
        status.notes = statusRow.notes;
        status.dateCreated = statusRow.date_created;
        status.createdBy = statusRow.created_by;

        refund.addStatusHistory(status);
    });

    // Process refund fees
    refundData.refund_fees.forEach(feeRow => {
        const refund = refundMap.get(feeRow.refunds_id);
        if (!refund) return;

        const refundFee = new RefundFee(
            feeRow.id,
            feeRow.fee_id,
            feeRow.refund_amount
        );
        refundFee.code = feeRow.code;
        refundFee.version = feeRow.version;
        refundFee.volume = feeRow.volume;

        refund.addFee(refundFee);
    });

    // Return single case or array of cases
    const cases = Array.from(caseMap.values()).map(c => c.case);
    return cases.length === 1 ? cases[0] : cases;
}
