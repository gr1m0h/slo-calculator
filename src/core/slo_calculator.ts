import * as fs from "fs/promises";
import * as path from "path";
import { SLIData, SLOConfig, SLOReport, ErrorBudget } from "../types";
import { DataValidator } from "../utils/data_validator";
import { ErrorBudgetCalculator } from "./error_budget_calculator";

export class SLOCalculator {
  private dataDir: string;
  private validator: DataValidator;
  private errorBudgetCalculator: ErrorBudgetCalculator;

  constructor(dataDir: string = "./slo-data") {
    this.dataDir = dataDir;
    this.validator = new DataValidator();
    this.errorBudgetCalculator = new ErrorBudgetCalculator();
  }

  async init(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.mkdir(path.join(this.dataDir, "input"), { recursive: true });
    await fs.mkdir(path.join(this.dataDir, "reports"), { recursive: true });
    await fs.mkdir(path.join(this.dataDir, "archive"), { recursive: true });
  }

  async loadData(sloName: string): Promise<SLIData[]> {
    const dataPath = path.join(this.dataDir, "input", `${sloName}.json`);
    const content = await fs.readFile(dataPath, "utf-8");
    const data: SLIData[] = JSON.parse(content);

    // Validate data
    this.validator.validateSLIData(data);

    return data;
  }

  async saveData(sloName: string, data: SLIData[]): Promise<void> {
    const outputPath = path.join(this.dataDir, "input", `${sloName}.json`);
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
  }

  async calculateSLO(sloName: string, config: SLOConfig): Promise<SLOReport> {
    const data = await this.loadData(sloName);

    // Sort by date and get window
    data.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const windowData = data.slice(-config.window);

    if (windowData.length === 0) {
      throw new Error("No data available for the specified window");
    }

    // Calculate metrics
    const metrics = this.calculateMetrics(windowData);

    // Calculate Error Budget
    const errorBudget = this.errorBudgetCalculator.calculate(
      metrics.adjustedSLI,
      config.target,
      config.window,
    );

    return {
      sloConfig: config,
      period: {
        start: windowData[0].date,
        end: windowData[windowData.length - 1].date,
      },
      rawSLI: metrics.rawSLI,
      adjustedSLI: metrics.adjustedSLI,
      errorBudget,
      dailyData: metrics.dailyData,
    };
  }

  private calculateMetrics(data: SLIData[]) {
    let totalRequests = 0;
    let totalSuccessful = 0;
    let adjustedSuccessful = 0;
    const dailyData = [];

    for (const day of data) {
      totalRequests += day.totalRequests;
      totalSuccessful += day.successfulRequests;

      // Adjusted SLI (外部サービスの影響を除外)
      const adjustedDaySuccessful =
        day.successfulRequests + (day.excludedFailures || 0);
      adjustedSuccessful += adjustedDaySuccessful;

      const daySLI =
        day.totalRequests > 0 ? day.successfulRequests / day.totalRequests : 0;
      const adjustedDaySLI =
        day.totalRequests > 0 ? adjustedDaySuccessful / day.totalRequests : 0;

      dailyData.push({
        date: day.date,
        sli: daySLI,
        adjustedSLI: adjustedDaySLI,
        excluded: (day.excludedFailures || 0) > 0,
      });
    }

    const rawSLI = totalRequests > 0 ? totalSuccessful / totalRequests : 0;
    const adjustedSLI =
      totalRequests > 0 ? adjustedSuccessful / totalRequests : 0;

    return {
      rawSLI,
      adjustedSLI,
      dailyData,
    };
  }

  async archiveOldReports(daysToKeep: number = 90): Promise<void> {
    const reportsDir = path.join(this.dataDir, "reports");
    const archiveDir = path.join(this.dataDir, "archive");
    const files = await fs.readdir(reportsDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    for (const file of files) {
      const filePath = path.join(reportsDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtime < cutoffDate) {
        const archivePath = path.join(archiveDir, file);
        await fs.rename(filePath, archivePath);
      }
    }
  }
}
