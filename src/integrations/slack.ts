import { SLOReport } from "../types";

export class SlackNotifier {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || "";
  }

  async sendReport(report: SLOReport): Promise<void> {
    if (!this.webhookUrl) {
      throw new Error("SLACK_WEBHOOK_URL environment variable not set");
    }

    const message = this.formatMessage(report);

    const response = await fetch(this.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }
  }

  private formatMessage(report: SLOReport): any {
    const status = this.getStatus(report);
    const { sloConfig, adjustedSLI, errorBudget } = report;

    return {
      text: `SLO Report: ${sloConfig.name}`,
      attachments: [
        {
          color: status.color,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `${status.emoji} ${sloConfig.name} SLO Report`,
              },
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Status*\n${status.label}`,
                },
                {
                  type: "mrkdwn",
                  text: `*Period*\n${report.period.start} to ${report.period.end}`,
                },
                {
                  type: "mrkdwn",
                  text: `*Adjusted SLI*\n${(adjustedSLI * 100).toFixed(3)}%`,
                },
                {
                  type: "mrkdwn",
                  text: `*Target SLO*\n${(sloConfig.target * 100).toFixed(2)}%`,
                },
                {
                  type: "mrkdwn",
                  text: `*Error Budget Remaining*\n${errorBudget.remaining.toFixed(3)}% (${errorBudget.remainingPercentage.toFixed(1)}%)`,
                },
                {
                  type: "mrkdwn",
                  text: `*Burn Rate*\n${errorBudget.burnRate.toFixed(4)}%/day`,
                },
              ],
            },
            {
              type: "divider",
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: this.getActionText(report),
              },
            },
          ],
        },
      ],
    };
  }

  private getStatus(report: SLOReport): {
    emoji: string;
    label: string;
    color: string;
  } {
    const { errorBudget, adjustedSLI, sloConfig } = report;

    if (
      errorBudget.remainingPercentage < 10 ||
      adjustedSLI < sloConfig.target * 0.95
    ) {
      return { emoji: "🔴", label: "CRITICAL", color: "danger" };
    } else if (
      errorBudget.remainingPercentage < 30 ||
      adjustedSLI < sloConfig.target
    ) {
      return { emoji: "🟡", label: "WARNING", color: "warning" };
    } else {
      return { emoji: "🟢", label: "HEALTHY", color: "good" };
    }
  }

  private getActionText(report: SLOReport): string {
    const { errorBudget, adjustedSLI, sloConfig } = report;
    const actions: string[] = [];

    if (errorBudget.remainingPercentage < 20) {
      actions.push("• 🚨 *Freeze all non-critical deployments immediately*");
      actions.push("• 📋 Schedule emergency SRE review");
    }

    if (adjustedSLI < sloConfig.target) {
      actions.push(
        "• ❌ *SLO target not met* - reliability improvements required",
      );
    }

    if (errorBudget.burnRate > 2) {
      const daysUntilExhaustion = Math.floor(
        errorBudget.remaining / errorBudget.burnRate,
      );
      actions.push(
        `• 🔥 *High burn rate* - budget exhaustion in ${daysUntilExhaustion} days`,
      );
    }

    return actions.length > 0
      ? `*Required Actions:*\n${actions.join("\n")}`
      : "✅ No immediate actions required";
  }
}
