// src/commands/InitCommand.ts
import { SLOCalculator } from "../core/slo_calculator";
import { BaseCommand } from "./base";

export class InitCommand extends BaseCommand {
  async execute(): Promise<void> {
    try {
      this.log("Initializing SLO data directory...");

      const calculator = new SLOCalculator(this.options.dataDir);
      await calculator.init();

      console.log("✅ Initialized SLO data directory structure:");
      console.log(`  📁 ${this.options.dataDir}/`);
      console.log("     ├── 📁 input/     - SLI data files");
      console.log("     ├── 📁 reports/   - Generated reports");
      console.log("     └── 📁 archive/   - Archived reports");
      console.log("");
      console.log("Next steps:");
      console.log("1. Generate a template: slo-calc template");
      console.log("2. Import your data: slo-calc import <file> <service-name>");
      console.log("3. Calculate SLO: slo-calc calculate <service-name>");
    } catch (error) {
      this.handleError(error);
    }
  }
}
