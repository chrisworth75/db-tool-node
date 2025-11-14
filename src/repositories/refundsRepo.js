import { refundsDb } from "../config/db.js";

/**
 * Fetches all refund-related data for a given CCD case number
 * Includes: refunds, status_history, and refund_fees
 */
export async function getAllRefundDataByCCD(ccd) {
    // Fetch refunds by CCD
    const refundsResult = await refundsDb.query(
        "SELECT * FROM refunds WHERE ccd_case_number = $1",
        [ccd]
    );

    if (refundsResult.rows.length === 0) {
        return {
            refunds: [],
            refund_status_history: [],
            refund_fees: []
        };
    }

    const refundIds = refundsResult.rows.map(r => r.id);

    // Fetch all related data in parallel
    const [statusHistoryResult, refundFeesResult] = await Promise.all([
        refundsDb.query(
            `SELECT * FROM status_history WHERE refunds_id = ANY($1::int[])`,
            [refundIds]
        ),
        refundsDb.query(
            `SELECT * FROM refund_fees WHERE refunds_id = ANY($1::int[])`,
            [refundIds]
        )
    ]);

    return {
        refunds: refundsResult.rows,
        refund_status_history: statusHistoryResult.rows,
        refund_fees: refundFeesResult.rows
    };
}

/**
 * Fetches refund data by payment reference
 * Finds refunds that reference a specific payment
 */
export async function getAllRefundDataByPaymentRef(paymentRef) {
    // Fetch refunds by payment_reference
    const refundsResult = await refundsDb.query(
        "SELECT * FROM refunds WHERE payment_reference = $1",
        [paymentRef]
    );

    if (refundsResult.rows.length === 0) {
        return {
            refunds: [],
            refund_status_history: [],
            refund_fees: []
        };
    }

    const refundIds = refundsResult.rows.map(r => r.id);

    // Fetch all related data in parallel
    const [statusHistoryResult, refundFeesResult] = await Promise.all([
        refundsDb.query(
            `SELECT * FROM status_history WHERE refunds_id = ANY($1::int[])`,
            [refundIds]
        ),
        refundsDb.query(
            `SELECT * FROM refund_fees WHERE refunds_id = ANY($1::int[])`,
            [refundIds]
        )
    ]);

    return {
        refunds: refundsResult.rows,
        refund_status_history: statusHistoryResult.rows,
        refund_fees: refundFeesResult.rows
    };
}

/**
 * Legacy function for backwards compatibility
 */
export async function getRefundsByCCD(ccd) {
    const result = await refundsDb.query(
        "SELECT * FROM refunds WHERE ccd_case_number = $1",
        [ccd]
    );
    return result.rows;
}
