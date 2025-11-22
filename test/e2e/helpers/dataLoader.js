/**
 * Database test data loader
 * Inserts and cleans up test data for e2e tests
 */

import pkg from 'pg';
const { Client } = pkg;

/**
 * Creates a database client with the given config
 */
function createClient(config) {
    return new Client({
        host: config.host || 'localhost',
        port: config.port,
        user: config.user || 'postgres',
        password: config.password || 'postgres',
        database: config.database
    });
}

/**
 * Loads payment data into payments database
 */
export async function loadPaymentsData(paymentsData, config) {
    const client = createClient(config);

    try {
        await client.connect();

        // Insert payment_fee_link
        await client.query(`
            INSERT INTO payment_fee_link
            (id, date_created, date_updated, payment_reference, org_id, enterprise_service_name,
             ccd_case_number, case_reference, service_request_callback_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO NOTHING
        `, [
            paymentsData.payment_fee_link.id,
            paymentsData.payment_fee_link.date_created,
            paymentsData.payment_fee_link.date_updated,
            paymentsData.payment_fee_link.payment_reference,
            paymentsData.payment_fee_link.org_id,
            paymentsData.payment_fee_link.enterprise_service_name,
            paymentsData.payment_fee_link.ccd_case_number,
            paymentsData.payment_fee_link.case_reference,
            paymentsData.payment_fee_link.service_request_callback_url
        ]);

        // Insert fee
        await client.query(`
            INSERT INTO fee
            (id, code, version, payment_link_id, calculated_amount, volume, ccd_case_number,
             reference, net_amount, fee_amount, amount_due, date_created, date_updated)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (id) DO NOTHING
        `, [
            paymentsData.fee.id,
            paymentsData.fee.code,
            paymentsData.fee.version,
            paymentsData.fee.payment_link_id,
            paymentsData.fee.calculated_amount,
            paymentsData.fee.volume,
            paymentsData.fee.ccd_case_number,
            paymentsData.fee.reference,
            paymentsData.fee.net_amount,
            paymentsData.fee.fee_amount,
            paymentsData.fee.amount_due,
            paymentsData.fee.date_created,
            paymentsData.fee.date_updated
        ]);

        // Insert payment
        await client.query(`
            INSERT INTO payment
            (id, amount, case_reference, ccd_case_number, currency, date_created, date_updated,
             description, service_type, site_id, user_id, payment_channel, payment_method,
             payment_provider, payment_status, payment_link_id, customer_reference,
             external_reference, organisation_name, pba_number, reference, giro_slip_no,
             s2s_service_name, reported_date_offline, service_callback_url,
             document_control_number, banked_date, payer_name, internal_reference)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
                    $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
            ON CONFLICT (id) DO NOTHING
        `, [
            paymentsData.payment.id,
            paymentsData.payment.amount,
            paymentsData.payment.case_reference,
            paymentsData.payment.ccd_case_number,
            paymentsData.payment.currency,
            paymentsData.payment.date_created,
            paymentsData.payment.date_updated,
            paymentsData.payment.description,
            paymentsData.payment.service_type,
            paymentsData.payment.site_id,
            paymentsData.payment.user_id,
            paymentsData.payment.payment_channel,
            paymentsData.payment.payment_method,
            paymentsData.payment.payment_provider,
            paymentsData.payment.payment_status,
            paymentsData.payment.payment_link_id,
            paymentsData.payment.customer_reference,
            paymentsData.payment.external_reference,
            paymentsData.payment.organisation_name,
            paymentsData.payment.pba_number,
            paymentsData.payment.reference,
            paymentsData.payment.giro_slip_no,
            paymentsData.payment.s2s_service_name,
            paymentsData.payment.reported_date_offline,
            paymentsData.payment.service_callback_url,
            paymentsData.payment.document_control_number,
            paymentsData.payment.banked_date,
            paymentsData.payment.payer_name,
            paymentsData.payment.internal_reference
        ]);

        // Insert fee_pay_apportion
        await client.query(`
            INSERT INTO fee_pay_apportion
            (id, payment_id, fee_id, payment_link_id, fee_amount, payment_amount,
             ccd_case_number, apportion_type, call_surplus_amount, created_by,
             date_created, date_updated, apportion_amount)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (id) DO NOTHING
        `, [
            paymentsData.fee_pay_apportion.id,
            paymentsData.fee_pay_apportion.payment_id,
            paymentsData.fee_pay_apportion.fee_id,
            paymentsData.fee_pay_apportion.payment_link_id,
            paymentsData.fee_pay_apportion.fee_amount,
            paymentsData.fee_pay_apportion.payment_amount,
            paymentsData.fee_pay_apportion.ccd_case_number,
            paymentsData.fee_pay_apportion.apportion_type,
            paymentsData.fee_pay_apportion.call_surplus_amount,
            paymentsData.fee_pay_apportion.created_by,
            paymentsData.fee_pay_apportion.date_created,
            paymentsData.fee_pay_apportion.date_updated,
            paymentsData.fee_pay_apportion.apportion_amount
        ]);

        // Insert status_history
        await client.query(`
            INSERT INTO status_history
            (id, date_created, date_updated, external_status, status, payment_id,
             error_code, message)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO NOTHING
        `, [
            paymentsData.status_history.id,
            paymentsData.status_history.date_created,
            paymentsData.status_history.date_updated,
            paymentsData.status_history.external_status,
            paymentsData.status_history.status,
            paymentsData.status_history.payment_id,
            paymentsData.status_history.error_code,
            paymentsData.status_history.message
        ]);

        // Insert payment_audit_history
        await client.query(`
            INSERT INTO payment_audit_history
            (id, ccd_case_no, audit_type, audit_payload, audit_description,
             date_created, date_updated)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO NOTHING
        `, [
            paymentsData.payment_audit_history.id,
            paymentsData.payment_audit_history.ccd_case_no,
            paymentsData.payment_audit_history.audit_type,
            paymentsData.payment_audit_history.audit_payload,
            paymentsData.payment_audit_history.audit_description,
            paymentsData.payment_audit_history.date_created,
            paymentsData.payment_audit_history.date_updated
        ]);

        console.log('✅ Payments data loaded successfully');
    } finally {
        await client.end();
    }
}

/**
 * Loads refund data into refunds database
 */
export async function loadRefundsData(refundsData, config) {
    const client = createClient(config);

    try {
        await client.connect();

        // Insert refund
        await client.query(`
            INSERT INTO refunds
            (id, date_created, date_updated, amount, reason, refund_status, reference,
             payment_reference, created_by, updated_by, ccd_case_number, fee_ids,
             notification_sent_flag, contact_details, service_type, refund_instruction_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            ON CONFLICT (id) DO NOTHING
        `, [
            refundsData.refund.id,
            refundsData.refund.date_created,
            refundsData.refund.date_updated,
            refundsData.refund.amount,
            refundsData.refund.reason,
            refundsData.refund.refund_status,
            refundsData.refund.reference,
            refundsData.refund.payment_reference,
            refundsData.refund.created_by,
            refundsData.refund.updated_by,
            refundsData.refund.ccd_case_number,
            refundsData.refund.fee_ids,
            refundsData.refund.notification_sent_flag,
            refundsData.refund.contact_details,
            refundsData.refund.service_type,
            refundsData.refund.refund_instruction_type
        ]);

        // Insert status_history
        await client.query(`
            INSERT INTO status_history
            (id, refunds_id, status, notes, date_created, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO NOTHING
        `, [
            refundsData.status_history.id,
            refundsData.status_history.refunds_id,
            refundsData.status_history.status,
            refundsData.status_history.notes,
            refundsData.status_history.date_created,
            refundsData.status_history.created_by
        ]);

        // Insert refund_fees
        await client.query(`
            INSERT INTO refund_fees
            (id, refunds_id, fee_id, code, version, volume, refund_amount)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO NOTHING
        `, [
            refundsData.refund_fee.id,
            refundsData.refund_fee.refunds_id,
            refundsData.refund_fee.fee_id,
            refundsData.refund_fee.code,
            refundsData.refund_fee.version,
            refundsData.refund_fee.volume,
            refundsData.refund_fee.refund_amount
        ]);

        console.log('✅ Refunds data loaded successfully');
    } finally {
        await client.end();
    }
}

/**
 * Cleans up test data from both databases
 */
export async function cleanupTestData(ccdNumber, paymentsConfig, refundsConfig) {
    // Cleanup payments database
    const paymentsClient = createClient(paymentsConfig);
    try {
        await paymentsClient.connect();

        await paymentsClient.query('DELETE FROM status_history WHERE payment_id IN (SELECT id FROM payment WHERE ccd_case_number = $1)', [ccdNumber]);
        await paymentsClient.query('DELETE FROM fee_pay_apportion WHERE ccd_case_number = $1', [ccdNumber]);
        await paymentsClient.query('DELETE FROM remission WHERE ccd_case_number = $1', [ccdNumber]);
        await paymentsClient.query('DELETE FROM payment WHERE ccd_case_number = $1', [ccdNumber]);
        await paymentsClient.query('DELETE FROM fee WHERE ccd_case_number = $1', [ccdNumber]);
        await paymentsClient.query('DELETE FROM payment_audit_history WHERE ccd_case_no = $1', [ccdNumber]);
        await paymentsClient.query('DELETE FROM payment_fee_link WHERE ccd_case_number = $1', [ccdNumber]);

        console.log('✅ Payments test data cleaned up');
    } finally {
        await paymentsClient.end();
    }

    // Cleanup refunds database
    const refundsClient = createClient(refundsConfig);
    try {
        await refundsClient.connect();

        await refundsClient.query('DELETE FROM status_history WHERE refunds_id IN (SELECT id FROM refunds WHERE ccd_case_number = $1)', [ccdNumber]);
        await refundsClient.query('DELETE FROM refund_fees WHERE refunds_id IN (SELECT id FROM refunds WHERE ccd_case_number = $1)', [ccdNumber]);
        await refundsClient.query('DELETE FROM refunds WHERE ccd_case_number = $1', [ccdNumber]);

        console.log('✅ Refunds test data cleaned up');
    } finally {
        await refundsClient.end();
    }
}
