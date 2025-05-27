import { BaseCommand } from "./base";
import { SLOCalculator } from "../core/slo_calculator";
import { DataImporter } from "../io/data_importer";

export class ImportCommand extends BaseCommand {
  async execute(file: string, sloName: string, options: any): Promise<void> {
    try {
      this.log(`Importing data from ${file} for ${sloName}...`);

      const calculator = new SLOCalculator(this.options.dataDir);
      const importer = new DataImporter();

      // Import data
      const newData = await importer.importFromFile(file, {
        validateData: options.validate !== false,
      });

      this.info(`Imported ${newData.length} data points`);

      // Handle merge option
      let dataToSave = newData;
      if (options.merge) {
        try {
          const existingData = await calculator.loadData(sloName);
          dataToSave = await importer.mergeWithExisting(newData, existingData);
          this.info(
            `Merged with existing data. Total: ${dataToSave.length} data points`,
          );
        } catch (error) {
          // No existing data, just use new data
          this.log("No existing data found, creating new dataset");
        }
      }

      // Save data
      await calculator.saveData(sloName, dataToSave);

      // Show summary
      const summary = this.generateSummary(dataToSave);
      console.log("\n📊 Import Summary:");
      console.log(`  - Service: ${sloName}`);
      console.log(`  - Date Range: ${summary.startDate} to ${summary.endDate}`);
      console.log(`  - Total Days: ${summary.totalDays}`);
      console.log(`  - Days with External Issues: ${summary.excludedDays}`);
      console.log(`  - Average Raw SLI: ${summary.avgSLI}%`);

      this.success(
        `Data imported successfully to ${this.options.dataDir}/input/${sloName}.json`,
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  private generateSummary(data: any[]): any {
    const sorted = data.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const excludedDays = data.filter(
      (d) => (d.excludedFailures || 0) > 0,
    ).length;

    let totalSLI = 0;
    let totalRequests = 0;
    let totalSuccessful = 0;

    data.forEach((d) => {
      totalRequests += d.totalRequests;
      totalSuccessful += d.successfulRequests;
      if (d.totalRequests > 0) {
        totalSLI += d.successfulRequests / d.totalRequests;
      }
    });

    return {
      startDate: sorted[0]?.date || "N/A",
      endDate: sorted[sorted.length - 1]?.date || "N/A",
      totalDays: data.length,
      excludedDays,
      avgSLI:
        data.length > 0
          ? ((totalSuccessful / totalRequests) * 100).toFixed(3)
          : "0.000",
    };
  }
}
