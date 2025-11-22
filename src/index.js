import { parseArgs } from "./utils/args.js";
import { getAllPaymentDataByCCD } from "./repositories/paymentsRepo.js";
import { getAllRefundDataByCCD } from "./repositories/refundsRepo.js";
import { mergeAllData } from "./services/mergeService.js";
import { transformToCase } from "./services/caseTransformer.js";

async function main() {
    const args = parseArgs();
    const ccd = args.ccd;

    if (!ccd) {
        console.error("Usage: node src/index.js --ccd <CCD_NUMBER>");
        console.error("Example: node src/index.js --ccd 1111111111111111");
        process.exit(1);
    }

    try {
        console.log("Fetching all data for CCD:", ccd);

        // Fetch all payment and refund data in parallel
        const [paymentData, refundData] = await Promise.all([
            getAllPaymentDataByCCD(ccd),
            getAllRefundDataByCCD(ccd)
        ]);

        // Transform to Case DTO
        const caseData = transformToCase(paymentData, refundData);

        // Output the case(s)
        if (Array.isArray(caseData)) {
            // Multiple cases found
            console.log(JSON.stringify({
                cases: caseData,
                summary: {
                    caseCount: caseData.length,
                    caseSummaries: caseData.map(c => ({
                        ccdCaseNumber: c.ccdCaseNumber,
                        ...c.getSummary()
                    }))
                }
            }, null, 2));
        } else {
            // Single case
            console.log(JSON.stringify({
                case: caseData,
                summary: caseData.getSummary()
            }, null, 2));
        }
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

main().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
