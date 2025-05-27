import * as fs from "fs/promises";
import { stringify } from "csv-stringify/sync";
import { SLIData } from "../types";

export class TemplateGenerator {
  async generateCSVTemplate(
    filepath: string = "./sli-template.csv",
  ): Promise<void> {
    const sampleData = this.getSampleData();
    const csv = stringify(sampleData, {
      header: true,
      columns: [
        "date",
        "totalRequests",
        "successfulRequests",
        "excludedFailures",
        "reason",
      ],
    });

    await fs.writeFile(filepath, csv);
  }

  async generateJSONTemplate(
    filepath: string = "./sli-template.json",
  ): Promise<void> {
    const sampleData = this.getSampleData();
    const json = JSON.stringify(sampleData, null, 2);

    await fs.writeFile(filepath, json);
  }

  async generateConfigTemplate(
    filepath: string = "./slo-config.json",
  ): Promise<void> {
    const config = {
      services: [
        {
          name: "api-service",
          target: 0.999,
          window: 30,
          alerting: {
            channels: ["#sre-alerts"],
            thresholds: {
              errorBudgetRemaining: 20,
              burnRate: 2,
            },
          },
        },
        {
          name: "mobile-app",
          target: 0.995,
          window: 30,
          alerting: {
            channels: ["#mobile-alerts"],
            thresholds: {
              errorBudgetRemaining: 30,
              burnRate: 1.5,
            },
          },
        },
      ],
      externalServices: [
        {
          name: "AWS",
          patterns: ["AWS", "CloudFront", "S3"],
        },
        {
          name: "SORACOM",
          patterns: ["SORACOM", "SIM", "cellular"],
        },
        {
          name: "Stripe",
          patterns: ["Stripe", "payment", "checkout"],
        },
        {
          name: "Google Maps",
          patterns: ["Maps API", "geocoding", "directions"],
        },
      ],
    };

    await fs.writeFile(filepath, JSON.stringify(config, null, 2));
  }

  private getSampleData(): SLIData[] {
    const today = new Date();
    const data: SLIData[] = [];

    // Generate 7 days of sample data
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Simulate realistic data with some failures
      const totalRequests = 100000 + Math.floor(Math.random() * 20000);
      const baseSuccessRate = 0.998 + Math.random() * 0.002;
      const successfulRequests = Math.floor(totalRequests * baseSuccessRate);

      // Add external failures on some days
      let excludedFailures = 0;
      let reason = "";

      if (i === 4) {
        excludedFailures = 50;
        reason = "AWS us-east-1 outage";
      } else if (i === 1) {
        excludedFailures = 100;
        reason = "SORACOM API timeout spike";
      }

      data.push({
        date: dateStr,
        totalRequests,
        successfulRequests,
        excludedFailures,
        reason,
      });
    }

    return data;
  }

  async generateDatadogScript(
    filepath: string = "./fetch-datadog.sh",
  ): Promise<void> {
    const script = `#!/bin/bash
# Datadog SLI Fetcher Script
# Usage: ./fetch-datadog.sh <service-name> [date]

set -euo pipefail

# Configuration
API_KEY="\${DD_API_KEY:-}"
APP_KEY="\${DD_APP_KEY:-}"
SERVICE_NAME="\${1:-api-service}"
DATE="\${2:-$(date -d 'yesterday' +%Y-%m-%d)}"

if [[ -z "\$API_KEY" ]] || [[ -z "\$APP_KEY" ]]; then
    echo "Error: DD_API_KEY and DD_APP_KEY environment variables must be set"
    exit 1
fi

# Calculate timestamps
START_TS=$(date -d "\$DATE 00:00:00" +%s)
END_TS=$(date -d "\$DATE 23:59:59" +%s)

echo "Fetching SLI data for \$SERVICE_NAME on \$DATE..."

# Fetch total requests
TOTAL_REQUESTS=$(curl -s -X GET \\
    "https://api.datadoghq.com/api/v1/query?from=\${START_TS}&to=\${END_TS}&query=sum:service.requests.count{service:\${SERVICE_NAME}}.as_count()" \\
    -H "DD-API-KEY: \${API_KEY}" \\
    -H "DD-APPLICATION-KEY: \${APP_KEY}" \\
    | jq -r '.series[0].pointlist[-1][1] // 0')

# Fetch successful requests
SUCCESSFUL_REQUESTS=$(curl -s -X GET \\
    "https://api.datadoghq.com/api/v1/query?from=\${START_TS}&to=\${END_TS}&query=sum:service.requests.success{service:\${SERVICE_NAME}}.as_count()" \\
    -H "DD-API-KEY: \${API_KEY}" \\
    -H "DD-APPLICATION-KEY: \${APP_KEY}" \\
    | jq -r '.series[0].pointlist[-1][1] // 0')

# Create CSV entry
echo "date,totalRequests,successfulRequests,excludedFailures,reason" > "sli-\${SERVICE_NAME}-\${DATE}.csv"
echo "\${DATE},\${TOTAL_REQUESTS},\${SUCCESSFUL_REQUESTS},0," >> "sli-\${SERVICE_NAME}-\${DATE}.csv"

echo "Data saved to sli-\${SERVICE_NAME}-\${DATE}.csv"
echo "Total Requests: \${TOTAL_REQUESTS}"
echo "Successful Requests: \${SUCCESSFUL_REQUESTS}"
echo "Success Rate: $(echo "scale=4; \${SUCCESSFUL_REQUESTS}/\${TOTAL_REQUESTS}*100" | bc)%"
`;

    await fs.writeFile(filepath, script);
    await fs.chmod(filepath, 0o755); // Make executable
  }
}
