import { BaseCommand } from "./base";
import { SLOCalculator } from "../core/slo_calculator";

export class ArchiveCommand extends BaseCommand {
  async execute(options: any): Promise<void> {
    try {
      const daysToKeep = parseInt(options.days) || 90;
      this.log(`Archiving reports older than ${daysToKeep} days...`);

      const calculator = new SLOCalculator(this.options.dataDir);
      await calculator.archiveOldReports(daysToKeep);

      this.success(
        `Archived old reports. Reports older than ${daysToKeep} days moved to archive/`,
      );
    } catch (error) {
      this.handleError(error);
    }
  }
}
