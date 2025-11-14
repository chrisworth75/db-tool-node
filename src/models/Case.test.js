import { Case, ServiceRequest, Fee, Payment, Refund, Remission } from './Case.js';

describe('Case', () => {
    it('should create a case with CCD number', () => {
        const caseObj = new Case('12345');
        expect(caseObj.ccdCaseNumber).toBe('12345');
        expect(caseObj.serviceRequests).toEqual([]);
    });

    it('should add service requests', () => {
        const caseObj = new Case('12345');
        const sr = new ServiceRequest(1, 'RC-001', '12345', 'CASE-001');

        caseObj.addServiceRequest(sr);

        expect(caseObj.serviceRequests).toHaveLength(1);
        expect(caseObj.serviceRequests[0]).toBe(sr);
    });

    it('should calculate summary correctly', () => {
        const caseObj = new Case('12345');
        const sr = new ServiceRequest(1, 'RC-001', '12345', 'CASE-001');

        const fee = new Fee(1, 'FEE001', 1);
        fee.amount = 550;
        sr.addFee(fee);

        const payment = new Payment(1, 'RC-001', 550);
        sr.addPayment(payment);

        const refund = new Refund(1, 'RF-001', 100);
        payment.addRefund(refund);

        caseObj.addServiceRequest(sr);

        const summary = caseObj.getSummary();

        expect(summary.totalFees).toBe(550);
        expect(summary.totalPayments).toBe(550);
        expect(summary.totalRefunds).toBe(100);
        expect(summary.netAmount).toBe(450); // 550 - 100
        expect(summary.amountDue).toBe(0); // 550 - 550
        expect(summary.serviceRequestCount).toBe(1);
        expect(summary.feeCount).toBe(1);
        expect(summary.paymentCount).toBe(1);
        expect(summary.refundCount).toBe(1);
    });
});

describe('ServiceRequest', () => {
    it('should create a service request', () => {
        const sr = new ServiceRequest(1, 'RC-001', '12345', 'CASE-001');

        expect(sr.id).toBe(1);
        expect(sr.paymentReference).toBe('RC-001');
        expect(sr.ccdCaseNumber).toBe('12345');
        expect(sr.caseReference).toBe('CASE-001');
        expect(sr.fees).toEqual([]);
        expect(sr.payments).toEqual([]);
    });

    it('should add fees and payments', () => {
        const sr = new ServiceRequest(1, 'RC-001', '12345', 'CASE-001');
        const fee = new Fee(1, 'FEE001', 1);
        const payment = new Payment(1, 'RC-001', 100);

        sr.addFee(fee);
        sr.addPayment(payment);

        expect(sr.fees).toHaveLength(1);
        expect(sr.payments).toHaveLength(1);
    });

    it('should get all refunds across payments', () => {
        const sr = new ServiceRequest(1, 'RC-001', '12345', 'CASE-001');

        const payment1 = new Payment(1, 'RC-001', 100);
        const refund1 = new Refund(1, 'RF-001', 50);
        payment1.addRefund(refund1);

        const payment2 = new Payment(2, 'RC-002', 200);
        const refund2 = new Refund(2, 'RF-002', 25);
        payment2.addRefund(refund2);

        sr.addPayment(payment1);
        sr.addPayment(payment2);

        const allRefunds = sr.getAllRefunds();

        expect(allRefunds).toHaveLength(2);
        expect(allRefunds[0]).toBe(refund1);
        expect(allRefunds[1]).toBe(refund2);
    });

    it('should calculate SR summary with remissions', () => {
        const sr = new ServiceRequest(1, 'RC-001', '12345', 'CASE-001');

        const fee = new Fee(1, 'FEE001', 1);
        fee.amount = 550;

        const remission = new Remission(1, 'HWF-001', 275);
        fee.addRemission(remission);

        sr.addFee(fee);

        const payment = new Payment(1, 'RC-001', 275);
        sr.addPayment(payment);

        const summary = sr.getSummary();

        expect(summary.totalFees).toBe(550);
        expect(summary.totalPayments).toBe(275);
        expect(summary.totalRemissions).toBe(275);
        expect(summary.netAmount).toBe(550); // 275 payment + 275 remission
        expect(summary.amountDue).toBe(0); // 550 - 275 - 275
    });
});

describe('Fee', () => {
    it('should create a fee', () => {
        const fee = new Fee(1, 'FEE001', 1);

        expect(fee.id).toBe(1);
        expect(fee.code).toBe('FEE001');
        expect(fee.version).toBe(1);
        expect(fee.remissions).toEqual([]);
    });

    it('should add remissions', () => {
        const fee = new Fee(1, 'FEE001', 1);
        const remission = new Remission(1, 'HWF-001', 275);

        fee.addRemission(remission);

        expect(fee.remissions).toHaveLength(1);
        expect(fee.remissions[0]).toBe(remission);
    });
});

describe('Payment', () => {
    it('should create a payment', () => {
        const payment = new Payment(1, 'RC-001', 550);

        expect(payment.id).toBe(1);
        expect(payment.reference).toBe('RC-001');
        expect(payment.amount).toBe(550);
        expect(payment.currency).toBe('GBP');
        expect(payment.refunds).toEqual([]);
        expect(payment.statusHistory).toEqual([]);
    });

    it('should add refunds and status history', () => {
        const payment = new Payment(1, 'RC-001', 550);
        const refund = new Refund(1, 'RF-001', 100);

        payment.addRefund(refund);

        expect(payment.refunds).toHaveLength(1);
        expect(payment.refunds[0]).toBe(refund);
    });
});

describe('Refund', () => {
    it('should create a refund', () => {
        const refund = new Refund(1, 'RF-001', 100);

        expect(refund.id).toBe(1);
        expect(refund.reference).toBe('RF-001');
        expect(refund.amount).toBe(100);
        expect(refund.statusHistory).toEqual([]);
        expect(refund.fees).toEqual([]);
    });

    it('should add status history and fees', () => {
        const refund = new Refund(1, 'RF-001', 100);
        const status = { id: 1, status: 'Approved' };
        const fee = { id: 1, feeId: 1, refundAmount: 50 };

        refund.addStatusHistory(status);
        refund.addFee(fee);

        expect(refund.statusHistory).toHaveLength(1);
        expect(refund.fees).toHaveLength(1);
    });
});

describe('Case with multiple SRs', () => {
    it('should calculate summary across multiple SRs', () => {
        const caseObj = new Case('12345');

        // SR 1
        const sr1 = new ServiceRequest(1, 'RC-001', '12345', 'CASE-001');
        const fee1 = new Fee(1, 'FEE001', 1);
        fee1.amount = 300;
        sr1.addFee(fee1);

        const payment1 = new Payment(1, 'RC-001', 300);
        sr1.addPayment(payment1);

        // SR 2
        const sr2 = new ServiceRequest(2, 'RC-002', '12345', 'CASE-002');
        const fee2 = new Fee(2, 'FEE002', 1);
        fee2.amount = 250;
        sr2.addFee(fee2);

        const payment2 = new Payment(2, 'RC-002', 250);
        const refund = new Refund(1, 'RF-001', 100);
        payment2.addRefund(refund);
        sr2.addPayment(payment2);

        caseObj.addServiceRequest(sr1);
        caseObj.addServiceRequest(sr2);

        const summary = caseObj.getSummary();

        expect(summary.serviceRequestCount).toBe(2);
        expect(summary.totalFees).toBe(550);
        expect(summary.totalPayments).toBe(550);
        expect(summary.totalRefunds).toBe(100);
        expect(summary.netAmount).toBe(450);
    });
});
