import { parseArgs } from "./utils/args.js";
import { getPaymentsByCCD } from "./repositories/paymentsRepo.js";
import { getRefundsByCCD } from "./repositories/refundsRepo.js";
import { mergePaymentsAndRefunds } from "./services/mergeService.js";

async function main() {
    const args = parseArgs();
    const ccd = args.ccd;

    if (!ccd) {
        console.error("Usage: node index.js --ccd <CCD_NUMBER>");
        process.exit(1);
    }

    console.log("Fetching data for CCD:", ccd);

    const payments = await getPaymentsByCCD(ccd);
    const refunds = await getRefundsByCCD(ccd);

    const combined = mergePaymentsAndRefunds(payments, refunds);

    console.log(JSON.stringify(combined, null, 2));
}

main().catch(err => {
    console.error("Error:", err);
});
