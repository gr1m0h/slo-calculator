import { SLIData } from "../types";

export class DataValidator {
  validateSLIData(data: SLIData[]): void {
    if (!Array.isArray(data)) {
      throw new Error("Data must be an array");
    }

    if (data.length === 0) {
      throw new Error("Data array cannot be empty");
    }

    const seenDates = new Set<string>();

    data.forEach((item, index) => {
      this.validateSLIDataItem(item, index);

      // Check for duplicate dates
      if (seenDates.has(item.date)) {
        throw new Error(`Duplicate date found: ${item.date}`);
      }
      seenDates.add(item.date);
    });
  }

  private validateSLIDataItem(item: SLIData, index: number): void {
    const prefix = `Data item at index ${index}`;

    // Required fields
    if (!item.date) {
      throw new Error(`${prefix}: 'date' is required`);
    }

    if (typeof item.totalRequests !== "number") {
      throw new Error(`${prefix}: 'totalRequests' must be a number`);
    }

    if (typeof item.successfulRequests !== "number") {
      throw new Error(`${prefix}: 'successfulRequests' must be a number`);
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(item.date)) {
      throw new Error(`${prefix}: Invalid date format. Use YYYY-MM-DD`);
    }

    // Validate date is valid
    const date = new Date(item.date);
    if (isNaN(date.getTime())) {
      throw new Error(`${prefix}: Invalid date value: ${item.date}`);
    }

    // Logical validations
    if (item.totalRequests < 0) {
      throw new Error(`${prefix}: 'totalRequests' cannot be negative`);
    }

    if (item.successfulRequests < 0) {
      throw new Error(`${prefix}: 'successfulRequests' cannot be negative`);
    }

    if (item.successfulRequests > item.totalRequests) {
      throw new Error(
        `${prefix}: 'successfulRequests' cannot exceed 'totalRequests'`,
      );
    }

    // Optional fields validation
    if (item.excludedFailures !== undefined) {
      if (typeof item.excludedFailures !== "number") {
        throw new Error(`${prefix}: 'excludedFailures' must be a number`);
      }

      if (item.excludedFailures < 0) {
        throw new Error(`${prefix}: 'excludedFailures' cannot be negative`);
      }

      const totalFailures = item.totalRequests - item.successfulRequests;
      if (item.excludedFailures > totalFailures) {
        throw new Error(
          `${prefix}: 'excludedFailures' cannot exceed total failures`,
        );
      }
    }

    // Validate reason if excludedFailures is provided
    if (item.excludedFailures && item.excludedFailures > 0 && !item.reason) {
      console.warn(
        `${prefix}: 'reason' should be provided when 'excludedFailures' is greater than 0`,
      );
    }
  }

  validateDateRange(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid date format");
    }

    if (start > end) {
      throw new Error("Start date cannot be after end date");
    }

    // Check if date range is reasonable (not more than 1 year)
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > oneYear) {
      console.warn("Date range exceeds one year. This may impact performance.");
    }
  }

  validateSLOTarget(target: number): void {
    if (typeof target !== "number") {
      throw new Error("SLO target must be a number");
    }

    if (target <= 0 || target > 1) {
      throw new Error(
        "SLO target must be between 0 and 1 (exclusive of 0, inclusive of 1)",
      );
    }

    if (target < 0.5) {
      console.warn(
        "SLO target is below 50%. This is unusually low for most services.",
      );
    }
  }

  validateWindow(window: number): void {
    if (typeof window !== "number" || !Number.isInteger(window)) {
      throw new Error("Window must be an integer");
    }

    if (window <= 0) {
      throw new Error("Window must be positive");
    }

    if (window > 90) {
      console.warn(
        "Window exceeds 90 days. Consider using a shorter window for more actionable insights.",
      );
    }
  }
}
