export interface BurnRateAlerts {
  [interval: string]: number;
}

/**
 * Based on SLO and SLO period (in days), evenly distributed acceptable error rate for each window.
 * Calculate the error threshold (actual error rate threshold) by scaling with the input Burn Rate threshold.
 *
 * The input key is in the format "long window_short window".
 * Example: "1_5" means 1 hour and 5 minutes.
 *
 * Calculation:
 * allowed_long = errorAllowance * ((longWindow×60) / totalMinutes)
 * allowed_short = errorAllowance * (shortWindow / totalMinutes)
 * errorThreshold_long = burnRateThreshold * allowed_long
 * errorThreshold_short = burnRateThreshold * allowed_short
 *
 * Here,
 * errorAllowance = 1 - (sloPercent / 100)
 * totalMinutes = sloWindowDays × 24 × 60
 */
export function computeErrorRateThresholds(
  sloPercent: number,
  sloWindowDays: number,
  burnRateAlerts: BurnRateAlerts
): { [key: string]: { long: number; short: number } } {
  const errorBudget = 1 - sloPercent / 100;
  const totalMinutes = sloWindowDays * 24 * 60;
  const thresholds: { [key: string]: { long: number; short: number } } = {};

  for (const key in burnRateAlerts) {
    if (burnRateAlerts.hasOwnProperty(key)) {
      // key: "1_5" → 1h and 5min
      const parts = key.split('_');
      if (parts.length !== 2) continue;
      const longHours = parseFloat(parts[0]);    // long window(h)
      const shortMinutes = parseFloat(parts[1]);   // short window(min)
      const allowedLong = errorBudget * ((longHours * 60) / totalMinutes);
      const allowedShort = errorBudget * (shortMinutes / totalMinutes);
      const brThreshold = burnRateAlerts[key];
      thresholds[key] = {
        long: brThreshold * allowedLong,
        short: brThreshold * allowedShort,
      };
    }
  }
  return thresholds;
}
