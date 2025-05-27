import { ErrorBudget } from "../types";

export class ErrorBudgetCalculator {
  calculate(
    currentSLI: number,
    targetSLO: number,
    windowDays: number,
  ): ErrorBudget {
    // Error budget is the allowed failure rate
    const total = (1 - targetSLO) * 100;

    // How much we've consumed (negative means we're exceeding SLO)
    const consumed = Math.max(0, (targetSLO - currentSLI) * 100);

    // Remaining budget
    const remaining = total - consumed;
    const remainingPercentage = total > 0 ? (remaining / total) * 100 : 0;

    // Daily burn rate
    const burnRate = windowDays > 0 ? consumed / windowDays : 0;

    return {
      total: this.roundToDecimal(total, 3),
      consumed: this.roundToDecimal(consumed, 3),
      remaining: this.roundToDecimal(remaining, 3),
      remainingPercentage: this.roundToDecimal(remainingPercentage, 1),
      burnRate: this.roundToDecimal(burnRate, 4),
    };
  }

  calculateProjectedExhaustion(
    errorBudget: ErrorBudget,
    windowDays: number,
  ): number | null {
    if (errorBudget.burnRate <= 0 || errorBudget.remaining <= 0) {
      return null;
    }

    const daysUntilExhaustion = errorBudget.remaining / errorBudget.burnRate;
    return Math.floor(daysUntilExhaustion);
  }

  calculateRequiredSLI(
    targetSLO: number,
    remainingDays: number,
    currentErrorBudget: ErrorBudget,
  ): number {
    if (remainingDays <= 0) return targetSLO;

    // Calculate required SLI to meet target by end of window
    const remainingBudget =
      currentErrorBudget.total - currentErrorBudget.consumed;
    const maxAllowedFailureRate = remainingBudget / 100 / remainingDays;
    const requiredSLI = 1 - maxAllowedFailureRate;

    return Math.min(1, Math.max(0, requiredSLI));
  }

  private roundToDecimal(value: number, decimals: number): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}
