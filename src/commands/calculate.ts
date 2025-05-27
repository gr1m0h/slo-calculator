import { BaseCommand } from "./base";
import { SLOCalculator } from "../core/slo_calculator";
import { ReportGenerator } from "../io/report_generator";
import { SLOConfig } from "../types";
import { SlackNotifier } from "../integrations/slack";

export class CalculateCommand extends BaseCommand {
  async execute(sloName: string, options: any): Promise<void> {
    try {
      this.log(`Calculating SLO for ${sloName}...`);

      const calculator = new SLOCalculator(this.options.dataDir);
      const reportGenerator = new ReportGenerator(this.options.dataDir);

      // Parse and validate options
      const config: SLOConfig = {
        name: sloName,
        target: parseFloat(options.target) / 100,
        window: parseInt(options.window),
      };

      this.validateConfig(config);

      // Calculate SLO
      const report = await calculator.calculateSLO(sloName, config);

      // Generate report
      const filepath = await reportGenerator.generate(report, options.format);

      // Display summary
      this.displaySummary(report);

      this.success(`Report saved to: ${filepath}`);

      // Send to Slack if requested
      if (options.slack) {
        await this.notifySlack(report);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private validateConfig(config: SLOConfig): void {
    if (config.target <= 0 || config.target > 1) {
      throw new Error("Target must be between 0 and 100 (exclusive of 0)");
    }

    if (config.window <= 0 || config.window > 365) {
      throw new Error("Window must be between 1 and 365 days");
    }
  }

  private displaySummary(report: any): void {
    const { adjustedSLI, errorBudget, sloConfig } = report;
    const status = this.getStatus(report);

    console.log("\n" + "=".repeat(50));
    console.log(`📊 SLO Report: ${sloConfig.name}`);
    console.log("=".repeat(50));

    console.log(`\n${status.emoji} Overall Status: ${status.label}`);

    console.log("\n📈 Performance Metrics:");
    console.log(
      `  - Adjusted SLI: ${this.formatPercentage(adjustedSLI)} (Target: ${this.formatPercentage(sloConfig.target)})`,
    );
    console.log(
      `  - ${adjustedSLI >= sloConfig.target ? "✅ Meeting" : "❌ Missing"} SLO target`,
    );

    console.log("\n💰 Error Budget:");
    console.log(`  - Total Budget: ${errorBudget.total.toFixed(3)}%`);
    console.log(`  - Consumed: ${errorBudget.consumed.toFixed(3)}%`);
    console.log(
      `  - Remaining: ${errorBudget.remaining.toFixed(3)}% (${errorBudget.remainingPercentage.toFixed(1)}%)`,
    );
    console.log(`  - Burn Rate: ${errorBudget.burnRate.toFixed(4)}% per day`);

    if (errorBudget.burnRate > 0) {
      const daysUntilExhaustion = Math.floor(
        errorBudget.remaining / errorBudget.burnRate,
      );
      if (daysUntilExhaustion > 0) {
        console.log(`  - Projected Exhaustion: ${daysUntilExhaustion} days`);
      }
    }

    console.log("\n" + "=".repeat(50));
  }

  private formatPercentage(value: number): string {
    return `${(value * 100).toFixed(3)}%`;
  }

  private getStatus(report: any): { emoji: string; label: string } {
    const { errorBudget, adjustedSLI, sloConfig } = report;

    if (
      errorBudget.remainingPercentage < 10 ||
      adjustedSLI < sloConfig.target * 0.95
    ) {
      return { emoji: "🔴", label: "CRITICAL" };
    } else if (
      errorBudget.remainingPercentage < 30 ||
      adjustedSLI < sloConfig.target
    ) {
      return { emoji: "🟡", label: "WARNING" };
    } else {
      return { emoji: "🟢", label: "HEALTHY" };
    }
  }

  private async notifySlack(report: any): Promise<void> {
    try {
      const notifier = new SlackNotifier();
      await notifier.sendReport(report);
      this.info("Slack notification sent");
    } catch (error) {
      this.warn(`Failed to send Slack notification: ${error.message}`);
    }
  }
}
