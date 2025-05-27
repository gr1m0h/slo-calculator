import { BaseCommand } from "./base";
import { DataImporter } from "../io/data_importer";
import { DataValidator } from "../utils/data_validator";

export class ValidateCommand extends BaseCommand {
  async execute(file: string): Promise<void> {
    try {
      this.log(`Validating file: ${file}`);

      const importer = new DataImporter();
      const validator = new DataValidator();

      // Import and validate
      const data = await importer.importFromFile(file, { validateData: true });

      // Additional validation
      validator.validateSLIData(data);

      // Show validation results
      console.log("\n✅ Validation Results:");
      console.log(`  - File: ${file}`);
      console.log(`  - Format: Valid`);
      console.log(`  - Records: ${data.length}`);
      console.log(
        `  - Date Range: ${data[0].date} to ${data[data.length - 1].date}`,
      );

      // Check for potential issues
      const issues = this.checkForIssues(data);
      if (issues.length > 0) {
        console.log("\n⚠️  Potential Issues:");
        issues.forEach((issue) => console.log(`  - ${issue}`));
      } else {
        console.log("\n✅ No issues found");
      }

      this.success("File is valid and ready for import");
    } catch (error) {
      this.handleError(error);
    }
  }

  private checkForIssues(data: any[]): string[] {
    const issues: string[] = [];

    // Check for missing days
    const dates = data.map((d) => new Date(d.date).getTime());
    dates.sort((a, b) => a - b);

    let missingDays = 0;
    for (let i = 1; i < dates.length; i++) {
      const dayDiff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
      if (dayDiff > 1) {
        missingDays += dayDiff - 1;
      }
    }

    if (missingDays > 0) {
      issues.push(`${Math.floor(missingDays)} missing days in the date range`);
    }

    // Check for low traffic days
    const lowTrafficDays = data.filter((d) => d.totalRequests < 1000).length;
    if (lowTrafficDays > 0) {
      issues.push(`${lowTrafficDays} days with less than 1000 requests`);
    }

    // Check for 100% failure days
    const failureDays = data.filter((d) => d.successfulRequests === 0).length;
    if (failureDays > 0) {
      issues.push(`${failureDays} days with 0% success rate`);
    }

    // Check for excluded failures without reasons
    const missingReasons = data.filter(
      (d) => d.excludedFailures > 0 && !d.reason,
    ).length;
    if (missingReasons > 0) {
      issues.push(
        `${missingReasons} days with excluded failures but no reason provided`,
      );
    }

    return issues;
  }
}
