import { parseArgs } from "./utils/args.js";
import { getAllPaymentDataByCCD, getAllPaymentDataByRC } from "./repositories/paymentsRepo.js";
import { getAllRefundDataByCCD, getAllRefundDataByPaymentRef } from "./repositories/refundsRepo.js";
import { mergeAllData } from "./services/mergeService.js";
import { transformToCase } from "./services/caseTransformer.js";

async function main() {
    const args = parseArgs();
    const ccd = args.ccd;
    const rc = args.rc;

    if (!ccd && !rc) {
        console.error("Usage: node index.js --ccd <CCD_NUMBER> OR --rc <RC_NUMBER>");
        process.exit(1);
    }

    try {
        let paymentData, refundData;

        if (ccd) {
            console.log("Fetching all data for CCD:", ccd);

            // Fetch all payment and refund data in parallel
            [paymentData, refundData] = await Promise.all([
                getAllPaymentDataByCCD(ccd),
                getAllRefundDataByCCD(ccd)
            ]);
        } else if (rc) {
            console.log("Fetching all data for RC:", rc);

            // Fetch payment data by RC first
            paymentData = await getAllPaymentDataByRC(rc);

            // If we found payment data, try to get refunds by payment reference
            // Also try to get refunds by any CCD numbers found
            const ccdNumbers = paymentData.payment_fee_links.map(link => link.ccd_case_number);

            if (ccdNumbers.length > 0) {
                // Get refunds for all CCDs found
                const refundResults = await Promise.all([
                    getAllRefundDataByPaymentRef(rc),
                    ...ccdNumbers.map(ccdNum => getAllRefundDataByCCD(ccdNum))
                ]);

                // Merge all refund results
                refundData = {
                    refunds: [],
                    refund_status_history: [],
                    refund_fees: []
                };

                refundResults.forEach(result => {
                    refundData.refunds.push(...result.refunds);
                    refundData.refund_status_history.push(...result.refund_status_history);
                    refundData.refund_fees.push(...result.refund_fees);
                });

                // Deduplicate refunds by id
                const seenRefundIds = new Set();
                refundData.refunds = refundData.refunds.filter(r => {
                    if (seenRefundIds.has(r.id)) return false;
                    seenRefundIds.add(r.id);
                    return true;
                });

                // Deduplicate status history by id
                const seenStatusIds = new Set();
                refundData.refund_status_history = refundData.refund_status_history.filter(s => {
                    if (seenStatusIds.has(s.id)) return false;
                    seenStatusIds.add(s.id);
                    return true;
                });

                // Deduplicate refund fees by id
                const seenFeeIds = new Set();
                refundData.refund_fees = refundData.refund_fees.filter(f => {
                    if (seenFeeIds.has(f.id)) return false;
                    seenFeeIds.add(f.id);
                    return true;
                });
            } else {
                refundData = {
                    refunds: [],
                    refund_status_history: [],
                    refund_fees: []
                };
            }
        }

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
