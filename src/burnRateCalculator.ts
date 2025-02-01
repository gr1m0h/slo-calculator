export interface BurnRateThresholds {
  [interval: string]: number;
}

export function computeErrorRateThresholds(
  sloPercent: number,
  burnRateThresholds: BurnRateThresholds
): { [interval: string]: number } {
  const errorAllowance = 1 - sloPercent / 100;
  const thresholds: { [interval: string]: number } = {};

  for (const interval in burnRateThresholds) {
    if (burnRateThresholds.hasOwnProperty(interval)) {
      thresholds[interval] = burnRateThresholds[interval] * errorAllowance;
    }
  }
  return thresholds;
}
