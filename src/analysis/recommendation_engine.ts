import { SLOReport } from "../types";

export class RecommendationEngine {
  analyze(report: SLOReport): string[] {
    const recommendations: string[] = [];

    // Error Budget分析
    this.analyzeErrorBudget(report, recommendations);

    // SLO違反分析
    this.analyzeSLOViolation(report, recommendations);

    // 外部依存分析
    this.analyzeExternalDependencies(report, recommendations);

    // トレンド分析
    this.analyzeTrends(report, recommendations);

    // モビリティ特有の分析
    this.analyzeMobilitySpecific(report, recommendations);

    return recommendations;
  }

  private analyzeErrorBudget(
    report: SLOReport,
    recommendations: string[],
  ): void {
    const { errorBudget } = report;

    if (errorBudget.remainingPercentage < 10) {
      recommendations.push(
        "🚨 **Critical**: Error budget is below 10%. Immediate action required. Consider emergency response procedures.",
      );
    } else if (errorBudget.remainingPercentage < 20) {
      recommendations.push(
        "⚠️ **Warning**: Error budget is below 20%. Freeze non-critical deployments and focus on stability.",
      );
    } else if (errorBudget.remainingPercentage < 50) {
      recommendations.push(
        "📊 **Caution**: Error budget below 50%. Review deployment practices and increase monitoring.",
      );
    }

    if (errorBudget.burnRate > 2) {
      recommendations.push(
        "🔥 **High Burn Rate**: Current burn rate exceeds 2%/day. At this rate, budget will be exhausted before window end.",
      );
    } else if (errorBudget.burnRate > 1) {
      recommendations.push(
        "📈 **Elevated Burn Rate**: Monitor closely - current trajectory may lead to budget exhaustion.",
      );
    }
  }

  private analyzeSLOViolation(
    report: SLOReport,
    recommendations: string[],
  ): void {
    const { adjustedSLI, rawSLI, sloConfig } = report;

    if (adjustedSLI < sloConfig.target) {
      recommendations.push(
        "❌ **SLO Violation**: Even after excluding external issues, SLO target is not met. Internal reliability improvements needed.",
      );

      const gap = (sloConfig.target - adjustedSLI) * 100;
      recommendations.push(
        `📉 **Performance Gap**: ${gap.toFixed(3)}% improvement needed to meet SLO target.`,
      );
    }

    if (rawSLI < sloConfig.target * 0.95) {
      recommendations.push(
        "🎯 **Significant Miss**: Raw SLI is >5% below target. Consider comprehensive reliability review.",
      );
    }
  }

  private analyzeExternalDependencies(
    report: SLOReport,
    recommendations: string[],
  ): void {
    const excludedDays = report.dailyData.filter((d) => d.excluded).length;
    const totalDays = report.dailyData.length;
    const excludedPercentage = (excludedDays / totalDays) * 100;

    if (excludedPercentage > 20) {
      recommendations.push(
        "🔄 **High External Impact**: >20% of days affected by external services. Critical dependency on third parties.",
      );
      recommendations.push(
        "💡 Consider: Multi-vendor strategy, circuit breakers, or bringing critical services in-house.",
      );
    } else if (excludedPercentage > 10) {
      recommendations.push(
        "🔄 **External Dependencies**: >10% of days affected. Review redundancy and fallback strategies.",
      );
    }

    // 連続した外部影響をチェック
    let consecutiveExcluded = 0;
    let maxConsecutive = 0;

    for (const day of report.dailyData) {
      if (day.excluded) {
        consecutiveExcluded++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveExcluded);
      } else {
        consecutiveExcluded = 0;
      }
    }

    if (maxConsecutive >= 3) {
      recommendations.push(
        `⚠️ **Prolonged External Issues**: ${maxConsecutive} consecutive days with external impacts. Review vendor SLAs.`,
      );
    }
  }

  private analyzeTrends(report: SLOReport, recommendations: string[]): void {
    const { dailyData } = report;
    if (dailyData.length < 7) return; // 十分なデータがない

    // 移動平均でトレンドを分析
    const recentDays = 7;
    const recentData = dailyData.slice(-recentDays);
    const olderData = dailyData.slice(-recentDays * 2, -recentDays);

    if (olderData.length === recentDays) {
      const recentAvg =
        recentData.reduce((sum, d) => sum + d.adjustedSLI, 0) / recentDays;
      const olderAvg =
        olderData.reduce((sum, d) => sum + d.adjustedSLI, 0) / recentDays;

      const trend = ((recentAvg - olderAvg) / olderAvg) * 100;

      if (trend < -1) {
        recommendations.push(
          `📉 **Declining Performance**: ${Math.abs(trend).toFixed(1)}% decrease in recent 7-day average.`,
        );
      } else if (trend > 1) {
        recommendations.push(
          `📈 **Improving Performance**: ${trend.toFixed(1)}% increase in recent 7-day average.`,
        );
      }
    }
  }

  private analyzeMobilitySpecific(
    report: SLOReport,
    recommendations: string[],
  ): void {
    // モビリティシェアリング特有の分析
    const { dailyData } = report;

    // 週末パターンの検出
    const weekendData = dailyData.filter((d) => {
      const dayOfWeek = new Date(d.date).getDay();
      return dayOfWeek === 0 || dayOfWeek === 6;
    });

    if (weekendData.length > 0) {
      const weekendAvgSLI =
        weekendData.reduce((sum, d) => sum + d.adjustedSLI, 0) /
        weekendData.length;
      const overallAvgSLI =
        dailyData.reduce((sum, d) => sum + d.adjustedSLI, 0) / dailyData.length;

      if (weekendAvgSLI < overallAvgSLI * 0.98) {
        recommendations.push(
          "🚲 **Weekend Performance**: Lower SLI on weekends detected. Consider weekend-specific capacity planning.",
        );
      }
    }

    // IoT関連の推奨事項
    if (
      report.adjustedSLI < report.sloConfig.target &&
      report.rawSLI < report.adjustedSLI * 0.99
    ) {
      recommendations.push(
        "📡 **IoT Connectivity**: Consider implementing offline-first architecture for vehicle connectivity issues.",
      );
      recommendations.push(
        "🔋 **Device Health**: Implement predictive maintenance based on device telemetry data.",
      );
    }
  }

  generateExecutiveSummary(report: SLOReport): string {
    const status = this.determineOverallStatus(report);
    const { errorBudget, adjustedSLI, sloConfig } = report;

    return `
## Executive Summary

**Overall Status**: ${status.emoji} ${status.label}

**Key Metrics**:
- Adjusted SLI: ${(adjustedSLI * 100).toFixed(2)}% (Target: ${(sloConfig.target * 100).toFixed(1)}%)
- Error Budget Remaining: ${errorBudget.remaining.toFixed(2)}%
- Days Until Budget Exhaustion: ${this.calculateDaysUntilExhaustion(errorBudget) || "N/A"}

**Immediate Actions Required**: ${status.actionRequired ? "Yes" : "No"}
`;
  }

  private determineOverallStatus(report: SLOReport): {
    emoji: string;
    label: string;
    actionRequired: boolean;
  } {
    const { errorBudget, adjustedSLI, sloConfig } = report;

    if (
      errorBudget.remainingPercentage < 10 ||
      adjustedSLI < sloConfig.target * 0.95
    ) {
      return { emoji: "🔴", label: "Critical", actionRequired: true };
    } else if (
      errorBudget.remainingPercentage < 30 ||
      adjustedSLI < sloConfig.target
    ) {
      return { emoji: "🟡", label: "Warning", actionRequired: true };
    } else {
      return { emoji: "🟢", label: "Healthy", actionRequired: false };
    }
  }

  private calculateDaysUntilExhaustion(errorBudget: any): number | null {
    if (errorBudget.burnRate <= 0 || errorBudget.remaining <= 0) {
      return null;
    }
    return Math.floor(errorBudget.remaining / errorBudget.burnRate);
  }
}
