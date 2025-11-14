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
