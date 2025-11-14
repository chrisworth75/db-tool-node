/**
 * Domain Transfer Object for a Case
 *
 * Represents a case in its simplest form without reflecting the database structure.
 * Each case has one or more Service Requests (SRs), and each SR has fees, payments, and refunds.
 */

/**
 * Case - Top level object representing a case
 */
export class Case {
    constructor(ccdCaseNumber) {
        this.ccdCaseNumber = ccdCaseNumber;
        this.serviceRequests = []; // Array of ServiceRequest objects
    }

    addServiceRequest(serviceRequest) {
        this.serviceRequests.push(serviceRequest);
    }

    /**
     * Get summary statistics for the case
     */
    getSummary() {
        const totals = this.serviceRequests.reduce((acc, sr) => {
            const srSummary = sr.getSummary();
            return {
                totalFees: acc.totalFees + srSummary.totalFees,
                totalPayments: acc.totalPayments + srSummary.totalPayments,
                totalRefunds: acc.totalRefunds + srSummary.totalRefunds,
                totalRemissions: acc.totalRemissions + srSummary.totalRemissions,
                serviceRequestCount: acc.serviceRequestCount + 1,
                feeCount: acc.feeCount + srSummary.feeCount,
                paymentCount: acc.paymentCount + srSummary.paymentCount,
                refundCount: acc.refundCount + srSummary.refundCount,
                remissionCount: acc.remissionCount + srSummary.remissionCount
            };
        }, {
            totalFees: 0,
            totalPayments: 0,
            totalRefunds: 0,
            totalRemissions: 0,
            serviceRequestCount: 0,
            feeCount: 0,
            paymentCount: 0,
            refundCount: 0,
            remissionCount: 0
        });

        return {
            ...totals,
            netAmount: totals.totalPayments + totals.totalRemissions - totals.totalRefunds,
            amountDue: totals.totalFees - totals.totalPayments - totals.totalRemissions
        };
    }
}

/**
 * ServiceRequest (SR) - Represents a payment_fee_link
 * Contains fees, payments, and related refunds
 */
export class ServiceRequest {
    constructor(id, paymentReference, ccdCaseNumber, caseReference) {
        this.id = id;
        this.paymentReference = paymentReference;
        this.ccdCaseNumber = ccdCaseNumber;
        this.caseReference = caseReference;
        this.fees = []; // Array of Fee objects
        this.payments = []; // Array of Payment objects
        this.dateCreated = null;
        this.dateUpdated = null;
        this.orgId = null;
        this.enterpriseServiceName = null;
        this.serviceRequestCallbackUrl = null;
    }

    addFee(fee) {
        this.fees.push(fee);
    }

    addPayment(payment) {
        this.payments.push(payment);
    }

    /**
     * Get all refunds across all payments in this SR
     */
    getAllRefunds() {
        return this.payments.flatMap(payment => payment.refunds);
    }

    /**
     * Get summary statistics for this service request
     */
    getSummary() {
        const totalFees = this.fees.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0);
        const totalRemissions = this.fees.reduce((sum, fee) => {
            return sum + fee.remissions.reduce((s, r) => s + (Number(r.amount) || 0), 0);
        }, 0);

        const totalPayments = this.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
        const totalRefunds = this.payments.reduce((sum, payment) => {
            return sum + payment.refunds.reduce((s, r) => s + (Number(r.amount) || 0), 0);
        }, 0);

        return {
            totalFees,
            totalPayments,
            totalRefunds,
            totalRemissions,
            feeCount: this.fees.length,
            paymentCount: this.payments.length,
            refundCount: this.getAllRefunds().length,
            remissionCount: this.fees.reduce((sum, fee) => sum + fee.remissions.length, 0),
            netAmount: totalPayments + totalRemissions - totalRefunds,
            amountDue: totalFees - totalPayments - totalRemissions
        };
    }
}

/**
 * Fee - Represents a fee within a service request
 */
export class Fee {
    constructor(id, code, version) {
        this.id = id;
        this.code = code;
        this.version = version;
        this.amount = 0;
        this.calculatedAmount = 0;
        this.netAmount = 0;
        this.amountDue = 0;
        this.volume = 1;
        this.reference = null;
        this.remissions = []; // Array of Remission objects (Help with Fees)
        this.dateCreated = null;
        this.dateUpdated = null;
    }

    addRemission(remission) {
        this.remissions.push(remission);
    }
}

/**
 * Payment - Represents a payment within a service request
 */
export class Payment {
    constructor(id, reference, amount) {
        this.id = id;
        this.reference = reference;
        this.amount = amount;
        this.currency = 'GBP';
        this.status = null;
        this.method = null;
        this.provider = null;
        this.channel = null;
        this.externalReference = null;
        this.customerReference = null;
        this.pbaNumber = null;
        this.payerName = null;
        this.dateCreated = null;
        this.dateUpdated = null;
        this.bankedDate = null;
        this.refunds = []; // Array of Refund objects
        this.statusHistory = []; // Array of PaymentStatusHistory objects
        this.apportionments = []; // Array of Apportionment objects
    }

    addRefund(refund) {
        this.refunds.push(refund);
    }

    addStatusHistory(status) {
        this.statusHistory.push(status);
    }

    addApportionment(apportionment) {
        this.apportionments.push(apportionment);
    }
}

/**
 * Refund - Represents a refund for a payment
 */
export class Refund {
    constructor(id, reference, amount) {
        this.id = id;
        this.reference = reference;
        this.amount = amount;
        this.reason = null;
        this.reasonCode = null;
        this.status = null;
        this.refundInstructionType = null;
        this.paymentReference = null;
        this.dateCreated = null;
        this.dateUpdated = null;
        this.createdBy = null;
        this.updatedBy = null;
        this.statusHistory = []; // Array of RefundStatusHistory objects
        this.fees = []; // Array of RefundFee objects
    }

    addStatusHistory(status) {
        this.statusHistory.push(status);
    }

    addFee(fee) {
        this.fees.push(fee);
    }
}

/**
 * Remission - Represents Help with Fees (HWF) remission
 */
export class Remission {
    constructor(id, hwfReference, amount) {
        this.id = id;
        this.hwfReference = hwfReference;
        this.amount = amount;
        this.beneficiaryName = null;
        this.remissionReference = null;
        this.dateCreated = null;
        this.dateUpdated = null;
    }
}

/**
 * PaymentStatusHistory - Represents payment status changes
 */
export class PaymentStatusHistory {
    constructor(id, status) {
        this.id = id;
        this.status = status;
        this.externalStatus = null;
        this.errorCode = null;
        this.message = null;
        this.dateCreated = null;
        this.dateUpdated = null;
    }
}

/**
 * RefundStatusHistory - Represents refund status changes
 */
export class RefundStatusHistory {
    constructor(id, status) {
        this.id = id;
        this.status = status;
        this.notes = null;
        this.dateCreated = null;
        this.createdBy = null;
    }
}

/**
 * Apportionment - Represents how a payment is apportioned to fees
 */
export class Apportionment {
    constructor(id, feeId, apportionAmount) {
        this.id = id;
        this.feeId = feeId;
        this.apportionAmount = apportionAmount;
        this.apportionType = null;
        this.callSurplusAmount = null;
        this.dateCreated = null;
        this.dateUpdated = null;
    }
}

/**
 * RefundFee - Represents the relationship between refunds and fees
 */
export class RefundFee {
    constructor(id, feeId, refundAmount) {
        this.id = id;
        this.feeId = feeId;
        this.refundAmount = refundAmount;
        this.code = null;
        this.version = null;
        this.volume = null;
    }
}
