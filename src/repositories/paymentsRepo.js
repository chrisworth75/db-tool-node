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

/**
 * Fetches payment data by payment reference (RC number)
 * First finds the payment, then gets all related data via payment_link_id
 */
export async function getAllPaymentDataByRC(rc) {
    // Find payment(s) by reference
    const paymentResult = await paymentsDb.query(
        "SELECT * FROM payment WHERE reference = $1",
        [rc]
    );

    if (paymentResult.rows.length === 0) {
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

    // Get unique payment_link_ids from payments
    const linkIds = [...new Set(paymentResult.rows.map(p => p.payment_link_id))];

    // Fetch payment_fee_link records
    const linkResult = await paymentsDb.query(
        `SELECT * FROM payment_fee_link WHERE id = ANY($1::bigint[])`,
        [linkIds]
    );

    // Get CCD numbers for audit history
    const ccdNumbers = [...new Set(linkResult.rows.map(link => link.ccd_case_number))];

    // Fetch all related data in parallel
    const [
        feesResult,
        apportionsResult,
        remissionsResult,
        auditResult
    ] = await Promise.all([
        paymentsDb.query(
            `SELECT * FROM fee WHERE payment_link_id = ANY($1::bigint[])`,
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
            `SELECT * FROM payment_audit_history WHERE ccd_case_no = ANY($1::varchar[])`,
            [ccdNumbers]
        )
    ]);

    // Get payment IDs for status history
    const paymentIds = paymentResult.rows.map(p => p.id);
    const statusHistoryResult = await paymentsDb.query(
        `SELECT * FROM status_history WHERE payment_id = ANY($1::bigint[])`,
        [paymentIds]
    );

    return {
        payment_fee_links: linkResult.rows,
        fees: feesResult.rows,
        payments: paymentResult.rows,
        apportionments: apportionsResult.rows,
        remissions: remissionsResult.rows,
        payment_status_history: statusHistoryResult.rows,
        payment_audit_history: auditResult.rows
    };
}

/**
 * Legacy function for backwards compatibility
 */
export async function getPaymentsByCCD(ccd) {
    const result = await paymentsDb.query(
        "SELECT * FROM payment WHERE ccd_case_number = $1",
        [ccd]
    );
    return result.rows;
}
