import { paymentsDb } from "../config/db.js";

/**
 * Fetches all payment-related data for a given CCD case number
 * Includes: payment_fee_links, fees, payments, apportions, remissions, status_history, and audit_history
 */
export async function getAllPaymentDataByCCD(ccd) {
    // Start from payment_fee_link - if none exist, return empty data
    const linkResult = await paymentsDb.query(
        "SELECT * FROM payment_fee_link WHERE ccd_case_number = $1",
        [ccd]
    );

    if (linkResult.rows.length === 0) {
        return {
            payment_fee_links: [],
            fees: [],
            payments: [],
            apportionments: [],
            remissions: [],
            payment_status_history: [],
            payment_audit_history: []
        };
    }

    const linkIds = linkResult.rows.map(link => link.id);

    // Fetch all related data in parallel
    const [
        feesResult,
        paymentsResult,
        apportionsResult,
        remissionsResult,
        auditResult
    ] = await Promise.all([
        paymentsDb.query(
            `SELECT * FROM fee WHERE payment_link_id = ANY($1::bigint[])`,
            [linkIds]
        ),
        paymentsDb.query(
            `SELECT * FROM payment WHERE payment_link_id = ANY($1::bigint[])`,
            [linkIds]
        ),
        paymentsDb.query(
            `SELECT * FROM fee_pay_apportion WHERE payment_link_id = ANY($1::bigint[])`,
            [linkIds]
        ),
        paymentsDb.query(
            `SELECT * FROM remission WHERE payment_link_id = ANY($1::bigint[])`,
            [linkIds]
        ),
        paymentsDb.query(
            `SELECT * FROM payment_audit_history WHERE ccd_case_no = $1`,
            [ccd]
        )
    ]);

    // Get payment IDs for status history
    const paymentIds = paymentsResult.rows.map(p => p.id);
    const statusHistoryResult = paymentIds.length > 0
        ? await paymentsDb.query(
            `SELECT * FROM status_history WHERE payment_id = ANY($1::bigint[])`,
            [paymentIds]
        )
        : { rows: [] };

    return {
        payment_fee_links: linkResult.rows,
        fees: feesResult.rows,
        payments: paymentsResult.rows,
        apportionments: apportionsResult.rows,
        remissions: remissionsResult.rows,
        payment_status_history: statusHistoryResult.rows,
        payment_audit_history: auditResult.rows
    };
}
