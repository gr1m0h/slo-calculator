import * as fs from "fs/promises";
import * as path from "path";
import { SLOReport, ReportFormat } from "../types";
import { RecommendationEngine } from "../analysis/recommendation_engine";

export class ReportGenerator {
  private dataDir: string;
  private recommendationEngine: RecommendationEngine;

  constructor(dataDir: string = "./slo-data") {
    this.dataDir = dataDir;
    this.recommendationEngine = new RecommendationEngine();
  }

  async generate(report: SLOReport, format: ReportFormat): Promise<string> {
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `slo-report-${report.sloConfig.name}-${timestamp}.${format === "markdown" ? "md" : "json"}`;
    const filepath = path.join(this.dataDir, "reports", filename);

    let content: string;
    if (format === "markdown") {
      content = this.generateMarkdown(report);
    } else {
      content = JSON.stringify(report, null, 2);
    }

    await fs.writeFile(filepath, content);
    return filepath;
  }

  private generateMarkdown(report: SLOReport): string {
    const { sloConfig, period, rawSLI, adjustedSLI, errorBudget, dailyData } =
      report;
    const recommendations = this.recommendationEngine.analyze(report);

    return `# SLO Report: ${sloConfig.name}

## Summary
- **Period**: ${period.start} to ${period.end} (${sloConfig.window} days)
- **Target SLO**: ${(sloConfig.target * 100).toFixed(2)}%
- **Raw SLI**: ${(rawSLI * 100).toFixed(3)}%
- **Adjusted SLI**: ${(adjustedSLI * 100).toFixed(3)}% (外部サービス影響除外)

## Error Budget
- **Total Budget**: ${errorBudget.total.toFixed(3)}%
- **Consumed**: ${errorBudget.consumed.toFixed(3)}%
- **Remaining**: ${errorBudget.remaining.toFixed(3)}% (${errorBudget.remainingPercentage.toFixed(1)}%)
- **Daily Burn Rate**: ${errorBudget.burnRate.toFixed(4)}%

## Daily Breakdown
${this.generateDailyTable(dailyData)}

## External Dependencies Impact
${this.generateExternalImpactSummary(report)}

## Recommendations
${this.formatRecommendations(recommendations)}

## Action Items
${this.generateActionItems(report, recommendations)}

---
*Report generated on ${new Date().toISOString()}*
`;
  }

  private generateDailyTable(dailyData: any[]): string {
    const headers = "| Date | Raw SLI | Adjusted SLI | External Issues |";
    const separator = "|------|---------|--------------|-----------------|";
    const rows = dailyData
      .map(
        (d) =>
          `| ${d.date} | ${(d.sli * 100).toFixed(3)}% | ${(d.adjustedSLI * 100).toFixed(3)}% | ${d.excluded ? "✓" : "-"} |`,
      )
      .join("\n");

    return `${headers}\n${separator}\n${rows}`;
  }

  private generateExternalImpactSummary(report: SLOReport): string {
    const excludedDays = report.dailyData.filter((d) => d.excluded);
    if (excludedDays.length === 0) {
      return "No external service impacts recorded during this period.";
    }

    const impactPercentage = (
      (excludedDays.length / report.dailyData.length) *
      100
    ).toFixed(1);
    const totalImpact = ((report.adjustedSLI - report.rawSLI) * 100).toFixed(3);

    return `
- **Days with external impacts**: ${excludedDays.length} (${impactPercentage}%)
- **Total SLI improvement from adjustments**: ${totalImpact}%
- **Most recent incident**: ${excludedDays[excludedDays.length - 1].date}
`;
  }

  private formatRecommendations(recommendations: string[]): string {
    if (recommendations.length === 0) {
      return "✅ All metrics within acceptable ranges.";
    }
    return recommendations.map((r) => `- ${r}`).join("\n");
  }

  private generateActionItems(
    report: SLOReport,
    recommendations: string[],
  ): string {
    const actions = [];

    if (report.errorBudget.remainingPercentage < 20) {
      actions.push("1. **Immediate**: Freeze non-critical deployments");
      actions.push(
        "2. **Today**: Review recent changes and rollback if necessary",
      );
      actions.push(
        "3. **This week**: Conduct incident review for root cause analysis",
      );
    }

    if (report.adjustedSLI < report.sloConfig.target) {
      actions.push("- Schedule reliability improvement sprint");
      actions.push("- Review and update alerting thresholds");
    }

    return actions.length > 0
      ? actions.join("\n")
      : "No immediate actions required.";
  }

  async generateComparisonReport(reports: SLOReport[]): Promise<string> {
    // 複数期間の比較レポート生成（将来の拡張用）
    const content = {
      generatedAt: new Date().toISOString(),
      reports: reports.map((r) => ({
        period: r.period,
        adjustedSLI: r.adjustedSLI,
        errorBudgetRemaining: r.errorBudget.remaining,
      })),
    };

    const filepath = path.join(
      this.dataDir,
      "reports",
      `comparison-${Date.now()}.json`,
    );
    await fs.writeFile(filepath, JSON.stringify(content, null, 2));
    return filepath;
  }
}
