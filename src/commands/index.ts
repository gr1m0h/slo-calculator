import { Command } from "commander";
import { InitCommand } from "./init";
import { ImportCommand } from "./import";
import { CalculateCommand } from "./calculate";
import { TemplateCommand } from "./template";
import { ValidateCommand } from "./validate";
import { ArchiveCommand } from "./archive";

export class CLIApplication {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupProgram();
    this.registerCommands();
  }

  private setupProgram(): void {
    this.program
      .name("slo-calc")
      .description(
        "SLO Calculator with manual adjustments for external service impacts",
      )
      .version("1.0.0")
      .option("--data-dir <dir>", "Data directory path", "./slo-data")
      .option("--verbose", "Enable verbose logging", false);
  }

  private registerCommands(): void {
    // Initialize
    this.program
      .command("init")
      .description("Initialize SLO data directory structure")
      .action(async () => {
        const command = new InitCommand(this.program.opts());
        await command.execute();
      });

    // Import
    this.program
      .command("import <file> <slo-name>")
      .description("Import SLI data from CSV or JSON file")
      .option("--merge", "Merge with existing data instead of replacing")
      .option("--no-validate", "Skip data validation")
      .action(async (file, sloName, options) => {
        const command = new ImportCommand(this.program.opts());
        await command.execute(file, sloName, options);
      });

    // Calculate
    this.program
      .command("calculate <slo-name>")
      .description("Calculate SLO and Error Budget")
      .option("-t, --target <percentage>", "SLO target percentage", "99.9")
      .option("-w, --window <days>", "Rolling window in days", "30")
      .option(
        "-f, --format <format>",
        "Output format (markdown|json)",
        "markdown",
      )
      .option("--slack", "Send report to Slack")
      .action(async (sloName, options) => {
        const command = new CalculateCommand(this.program.opts());
        await command.execute(sloName, options);
      });

    // Template
    this.program
      .command("template")
      .description("Generate template files")
      .option("--type <type>", "Template type (csv|json|config|datadog)", "csv")
      .option("--output <file>", "Output file path")
      .action(async (options) => {
        const command = new TemplateCommand(this.program.opts());
        await command.execute(options);
      });

    // Validate
    this.program
      .command("validate <file>")
      .description("Validate SLI data file")
      .action(async (file) => {
        const command = new ValidateCommand(this.program.opts());
        await command.execute(file);
      });

    // Archive
    this.program
      .command("archive")
      .description("Archive old reports")
      .option("--days <days>", "Days to keep reports", "90")
      .action(async (options) => {
        const command = new ArchiveCommand(this.program.opts());
        await command.execute(options);
      });
  }

  async run(argv: string[]): Promise<void> {
    try {
      await this.program.parseAsync(argv);
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  }
}

// Export for use in index.ts
export { CLIApplication as CLI };
