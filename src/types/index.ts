export interface SLIData {
  date: string; // Date in YYYY-MM-DD format
  totalRequests: number; // Total requests
  successfulRequests: number; // Successful requests
  excludedFailures?: number; // Optional, for excluded failures
  reason?: string; // Reason for exclusion, if any
}

export interface SLOConfig {
  name: string; // SLO name
  target: number; // SLO target (e.g. 99.9)
  window: number; // SLO window in days
}

export interface ErrorBudget {
  total: number; // Total error budget in requests
  consumed: number; // Consumed error budget in requests
  remaining: number; // Remaining error budget in requests
  remainingPercentage: number; // Remaining error budget as a percentage
  burnRate: number; // Burn rate as a percentage
}

export interface SLOReport {
  sloConfig: SLOConfig; // SLO configuration
  period: { start: string; end: string }; // Period of the report
  rawSLI: number; // Raw SLI value
  adjustedSLI: number; // Adjusted SLI value
  errorBudget: ErrorBudget; // Error budget details
  dailyData: Array<{
    date: string; // Date in YYYY-MM-DD format
    sli: number; // SLI value for the day
    adjustedSLI: number; // Adjusted SLI value for the day
    excluded: boolean; // Whether the day's data was excluded
  }>;
}

export type ReportFormat = "markdown" | "json"; // Supported report formats

export interface ImportOptions {
  format?: "csv" | "json"; // Format of the imported data
  validateData?: boolean; // Whether to validate the imported data
}

export interface CalculateOptions {
  target: string; // SLO target SLO (e.g. 99.9)
  window: string; // SLO window in days
  format: ReportFormat; // Format of the report
}
