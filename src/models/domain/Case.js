/**
 * CLEAN DOMAIN MODEL
 *
 * This model represents the business domain with NO duplications.
 * It's optimized for human understanding and manipulation.
 * Use this for presenting data to users and accepting input.
 */

/**
 * Case - A legal case
 */
export class Case {
    constructor(ccdCaseNumber) {
        this.ccdCaseNumber = ccdCaseNumber;
        this.serviceRequests = [];
    }

    addServiceRequest(sr) {
        this.serviceRequests.push(sr);
    }

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
                refundCount: acc.refundCount + srSummary.refundCount
            };
        }, {
            totalFees: 0,
            totalPayments: 0,
            totalRefunds: 0,
            totalRemissions: 0,
            serviceRequestCount: 0,
            feeCount: 0,
            paymentCount: 0,
            refundCount: 0
        });

        return {
            ...totals,
            netAmount: totals.totalPayments + totals.totalRemissions - totals.totalRefunds,
            amountDue: totals.totalFees - totals.totalPayments - totals.totalRemissions
        };
    }
}

/**
 * ServiceRequest - A request to pay fees (payment_fee_link)
 */
export class ServiceRequest {
    constructor(paymentReference, ccdCaseNumber) {
        this.paymentReference = paymentReference;
        this.ccdCaseNumber = ccdCaseNumber;
        this.caseReference = null;
        this.orgId = null;
        this.serviceName = null;
        this.fees = [];
        this.payments = [];
        this.createdAt = null;
        this.updatedAt = null;
    }

    addFee(fee) {
        this.fees.push(fee);
    }

    addPayment(payment) {
        this.payments.push(payment);
    }

    getAllRefunds() {
        return this.payments.flatMap(payment => payment.refunds);
    }

    getSummary() {
        const totalFees = this.fees.reduce((sum, fee) => sum + fee.getTotalAmount(), 0);
        const totalRemissions = this.fees.reduce((sum, fee) =>
            sum + fee.remissions.reduce((s, r) => s + Number(r.amount || 0), 0), 0
        );
        const totalPayments = this.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const totalRefunds = this.payments.reduce((sum, p) =>
            sum + p.refunds.reduce((s, r) => s + Number(r.amount || 0), 0), 0
        );

        return {
            totalFees,
            totalPayments,
            totalRefunds,
            totalRemissions,
            feeCount: this.fees.length,
            paymentCount: this.payments.length,
            refundCount: this.getAllRefunds().length,
            netAmount: totalPayments + totalRemissions - totalRefunds,
            amountDue: totalFees - totalPayments - totalRemissions
        };
    }
}

/**
 * Fee - A fee charged for a service
 */
export class Fee {
    constructor(code, version, amount) {
        this.code = code;
        this.version = version;
        this.amount = amount;
        this.volume = 1;
        this.reference = null;
        this.remissions = [];
        this.createdAt = null;
        this.updatedAt = null;
    }

    addRemission(remission) {
        this.remissions.push(remission);
    }

    getTotalAmount() {
        return Number(this.amount || 0) * this.volume;
    }

    getAmountAfterRemissions() {
        const remissionTotal = this.remissions.reduce((sum, r) => sum + Number(r.amount || 0), 0);
        return this.getTotalAmount() - remissionTotal;
    }
}

/**
 * Payment - A payment made
 */
export class Payment {
    constructor(reference, amount) {
        this.reference = reference;
        this.amount = amount;
        this.currency = 'GBP';
        this.status = null;
        this.method = null;
        this.provider = null;
        this.channel = null;
        this.customerReference = null;
        this.pbaNumber = null;
        this.payerName = null;
        this.refunds = [];
        this.feeAllocations = []; // How this payment is allocated to fees
        this.createdAt = null;
        this.updatedAt = null;
        this.bankedAt = null;
    }

    addRefund(refund) {
        this.refunds.push(refund);
    }

    addFeeAllocation(feeCode, amount) {
        this.feeAllocations.push({ feeCode, amount });
    }

    getTotalRefunded() {
        return this.refunds.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    }

    getNetAmount() {
        return Number(this.amount || 0) - this.getTotalRefunded();
    }
}

/**
 * Refund - A refund of a payment
 */
export class Refund {
    constructor(reference, amount, reason) {
        this.reference = reference;
        this.amount = amount;
        this.reason = reason;
        this.status = null;
        this.instructionType = null;
        this.createdAt = null;
        this.updatedAt = null;
        this.createdBy = null;
        this.updatedBy = null;
    }
}

/**
 * Remission - Help with Fees assistance
 */
export class Remission {
    constructor(hwfReference, amount) {
        this.hwfReference = hwfReference;
        this.amount = amount;
        this.beneficiaryName = null;
        this.createdAt = null;
        this.updatedAt = null;
    }
}
