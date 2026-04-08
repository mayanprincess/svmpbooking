/**
 * Rules for which OPERA room-rate rows are exposed on the booking site.
 * Adjust here when sales/channel strategy changes.
 */

/**
 * Web channel: only rate plans whose OPERA code **ends with `OTA`** (case-insensitive).
 * Examples from production: `BIMPOTA`, `BILSOTA`, `AIPLSOTA`, `AIPMOTA`.
 *
 * Set to `false` to disable this filter (still applies non-zero amount + opera-config).
 */
export const REQUIRE_RATE_PLAN_CODE_ENDING_WITH_OTA = true;

/**
 * Returns true if this rate plan is considered the OTA web product (suffix …OTA).
 */
export function isOtaSuffixedRatePlanCode(ratePlanCode: string | undefined): boolean {
	if (!REQUIRE_RATE_PLAN_CODE_ENDING_WITH_OTA) return true;
	if (!ratePlanCode?.trim()) return false;
	return ratePlanCode.trim().toUpperCase().endsWith('OTA');
}

/**
 * Returns true if the rate has a positive sell amount (before or after tax).
 */
export function rateHasPositiveAmount(amountBeforeTax: number, amountAfterTax: number): boolean {
	const before = Number(amountBeforeTax);
	const after = Number(amountAfterTax);
	if (Number.isFinite(after) && after > 0) return true;
	if (Number.isFinite(before) && before > 0) return true;
	return false;
}
