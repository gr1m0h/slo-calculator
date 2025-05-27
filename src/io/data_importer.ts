// src/io/DataImporter.ts
import * as fs from "fs/promises";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { SLIData, ImportOptions } from "../types";
import { DataValidator } from "../utils/data_validator";

export class DataImporter {
  private validator: DataValidator;

  constructor() {
    this.validator = new DataValidator();
  }

  async importFromFile(
    filePath: string,
    options?: ImportOptions,
  ): Promise<SLIData[]> {
    const content = await fs.readFile(filePath, "utf-8");
    const ext = path.extname(filePath).toLowerCase();

    let data: SLIData[];

    if (ext === ".csv") {
      data = await this.parseCSV(content);
    } else if (ext === ".json") {
      data = this.parseJSON(content);
    } else {
      throw new Error(`Unsupported file format: ${ext}. Use CSV or JSON.`);
    }

    if (options?.validateData !== false) {
      this.validator.validateSLIData(data);
    }

    return data;
  }

  private async parseCSV(content: string): Promise<SLIData[]> {
    try {
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: (value, context) => {
          // Auto-cast numbers
          if (
            context.column === "totalRequests" ||
            context.column === "successfulRequests" ||
            context.column === "excludedFailures"
          ) {
            return value ? parseInt(value, 10) : 0;
          }
          return value;
        },
      });

      return records.map((r: any) => ({
        date: this.normalizeDate(r.date),
        totalRequests: r.totalRequests || 0,
        successfulRequests: r.successfulRequests || 0,
        excludedFailures: r.excludedFailures || 0,
        reason: r.reason || "",
      }));
    } catch (error) {
      throw new Error(`Failed to parse CSV: ${error.message}`);
    }
  }

  private parseJSON(content: string): SLIData[] {
    try {
      const data = JSON.parse(content);
      if (!Array.isArray(data)) {
        throw new Error("JSON must contain an array of SLI data");
      }
      return data.map((item) => ({
        ...item,
        date: this.normalizeDate(item.date),
      }));
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }

  private normalizeDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }
    return date.toISOString().split("T")[0];
  }

  async mergeWithExisting(
    newData: SLIData[],
    existingData: SLIData[],
  ): Promise<SLIData[]> {
    const dataMap = new Map<string, SLIData>();

    // Add existing data
    existingData.forEach((item) => dataMap.set(item.date, item));

    // Merge new data (overwrites existing for same date)
    newData.forEach((item) => dataMap.set(item.date, item));

    // Convert back to array and sort
    return Array.from(dataMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }
}
