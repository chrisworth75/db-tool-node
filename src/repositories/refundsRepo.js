import { refundsDb } from "../config/db.js";

export async function getRefundsByCCD(ccd) {
    const result = await refundsDb.query(
        "SELECT * FROM refunds WHERE ccd_case_number = $1",
        [ccd]
    );
    return result.rows;
}
