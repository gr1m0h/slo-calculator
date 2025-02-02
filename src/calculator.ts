/**
 * burnRateCalculator.ts
 *
 * このライブラリは、指定された SLO（例: 99.9%）および SLO期間（日数）、
 * 対象タイムウィンドウ（時間）と予算消費率（%）をもとに、以下の各値を算出します。
 *
 * ・対象ウィンドウにおける均等配分の許容エラーレート：
 *      allowedErrorRate = (1 - SLO/100) × (対象タイムウィンドウ / (SLO期間（日数）×24))
 *
 * ・実際の Burn Rate 閾値：
 *      recommendedMultiplier = (SLO期間（日数）×24×予算消費率) / (対象タイムウィンドウ×100)
 *
 * ・検出時のエラーレート（＝ エラー閾値）：
 *      detectionErrorRate = allowedErrorRate × recommendedMultiplier
 *
 * ・最大 Burn Rate 閾値（SLO により決まる）：
 *      maxBurnRateThreshold = 1 / (1 - SLO/100)
 */

export interface Options {
  target: number;
  window: number;
  budget: number;
}

/**
 * 推奨 Burn Rate multiplier を算出します。
 *
 * 計算式:
 *   recommendedMultiplier = (SLO期間（日数）×24×予算消費率) / (対象タイムウィンドウ×100)
 *
 * 例: SLO期間30日、予算消費率2%、対象タイムウィンドウ1時間の場合
 *   recommendedMultiplier = (30×24×2) / (1×100) = 1440/100 = 14.4
 *
 * @param timeWindow 対象タイムウィンドウ（時間）
 * @param sloWindowDays SLO期間（日数）
 * @param budget 予算消費率（%）
 * @returns 推奨 multiplier（Burn Rate 閾値）
 */
export function recommendedMultiplier(timeWindow: number, sloWindowDays: number, budget: number): number {
  return (sloWindowDays * 24 * budget) / (timeWindow * 100);
}

/**
 * 与えられたオプションに基づき、各値を算出します。
 *
 * - allowedErrorRate:
 *      均等配分の許容エラーレート = (1 - SLO/100) × (対象タイムウィンドウ / (SLO期間×24))
 *
 * - burnRateThreshold:
 *      実際の Burn Rate 閾値 = recommendedMultiplier（予算消費率による計算結果）
 *
 * - detectionErrorRate:
 *      検出時のエラーレート（エラー閾値） = allowedErrorRate × burnRateThreshold
 *
 * - maxBurnRateThreshold:
 *      最大 Burn Rate 閾値 = 1 / (1 - SLO/100)
 *
 * @param opts 入力オプション
 */
export function calculate(opts: Options) {
  const { slo, sloWindowDays, timeWindow, budget } = opts;
  const errorBudget = 1 - slo / 100; // 例: 1 - 0.999 = 0.001
  const totalHours = sloWindowDays * 24; // 例: 30日 → 720時間
  const allowedErrorRate = errorBudget * (timeWindow / totalHours);
  const burnRateThreshold = recommendedMultiplier(timeWindow, sloWindowDays, budget);
  const detectionErrorRate = allowedErrorRate * burnRateThreshold;
  const maxBurnRateThreshold = 1 / errorBudget;

  return {
    burnRateThreshold,    // 実際の Burn Rate 閾値
    detectionTime: timeWindow,  // 対象タイムウィンドウそのもの（検出までの目安時間）
    allowedErrorRate,     // 均等配分された許容エラーレート
    detectionErrorRate,   // 検出時のエラーレート（エラー閾値）
    maxBurnRateThreshold, // 最大 Burn Rate 閾値（SLOから算出）
  };
}

