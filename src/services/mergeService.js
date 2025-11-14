/**
 * Merges comprehensive payment and refund data into a structured format
 */
export function mergeAllData(paymentData, refundData) {
    // Extract CCD numbers from both sources
    const ccdNumbers = new Set();

    paymentData.payment_fee_links.forEach(link => {
        if (link.ccd_case_number) ccdNumbers.add(link.ccd_case_number);
    });

    refundData.refunds.forEach(refund => {
        if (refund.ccd_case_number) ccdNumbers.add(refund.ccd_case_number);
    });

    // Calculate totals
    const totalPaymentAmount = paymentData.payments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
    );

    const totalRefundAmount = refundData.refunds.reduce(
        (sum, r) => sum + Number(r.amount || 0),
        0
    );

    const totalFeeAmount = paymentData.fees.reduce(
        (sum, f) => sum + Number(f.fee_amount || 0),
        0
    );

    const totalRemissionAmount = paymentData.remissions.reduce(
        (sum, r) => sum + Number(r.hwf_amount || 0),
        0
    );

    return {
        ccd_case_numbers: Array.from(ccdNumbers),
        payments: {
            payment_fee_links: paymentData.payment_fee_links,
            fees: paymentData.fees,
            payments: paymentData.payments,
            apportionments: paymentData.apportionments,
            remissions: paymentData.remissions,
            status_history: paymentData.payment_status_history,
            audit_history: paymentData.payment_audit_history
        },
        refunds: {
            refunds: refundData.refunds,
            status_history: refundData.refund_status_history,
            refund_fees: refundData.refund_fees
        },
        summary: {
            payment_fee_link_count: paymentData.payment_fee_links.length,
            fee_count: paymentData.fees.length,
            payment_count: paymentData.payments.length,
            refund_count: refundData.refunds.length,
            remission_count: paymentData.remissions.length,
            total_payment_amount: totalPaymentAmount,
            total_refund_amount: totalRefundAmount,
            total_fee_amount: totalFeeAmount,
            total_remission_amount: totalRemissionAmount,
            net_amount: totalPaymentAmount - totalRefundAmount
        }
    };
}

/**
 * Legacy function for backwards compatibility
 */
export function mergePaymentsAndRefunds(payments, refunds) {
    return {
        ccd: payments[0]?.ccd_case_number || refunds[0]?.ccd_case_number,
        payments,
        refunds,
        summary: {
            paymentCount: payments.length,
            refundCount: refunds.length,
            totalPayments: payments.reduce((a, p) => a + Number(p.amount || 0), 0),
            totalRefunds: refunds.reduce((a, r) => a + Number(r.amount || 0), 0)
        }
    };
}
