import { paymentsDb } from "../config/db.js";

export async function getPaymentsByCCD(ccd) {
    const result = await paymentsDb.query(
        "SELECT * FROM payment WHERE ccd_case_number = $1",
        [ccd]
    );
    return result.rows;
}
