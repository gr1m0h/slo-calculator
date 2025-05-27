import { BaseCommand } from "./base";
import { TemplateGenerator } from "../utils/template_generator";

export class TemplateCommand extends BaseCommand {
  async execute(options: any): Promise<void> {
    try {
      const generator = new TemplateGenerator();
      const type = options.type || "csv";
      const output = options.output;

      switch (type) {
        case "csv":
          await generator.generateCSVTemplate(output || "./sli-template.csv");
          this.success(
            `CSV template saved to: ${output || "./sli-template.csv"}`,
          );
          break;
        case "json":
          await generator.generateJSONTemplate(output || "./sli-template.json");
          this.success(
            `JSON template saved to: ${output || "./sli-template.json"}`,
          );
          break;
        case "config":
          await generator.generateConfigTemplate(output || "./slo-config.json");
          this.success(
            `Config template saved to: ${output || "./slo-config.json"}`,
          );
          break;
        case "datadog":
          await generator.generateDatadogScript(output || "./fetch-datadog.sh");
          this.success(
            `Datadog script saved to: ${output || "./fetch-datadog.sh"}`,
          );
          this.info(
            "Make sure to set DD_API_KEY and DD_APP_KEY environment variables",
          );
          break;
        default:
          throw new Error(
            `Unknown template type: ${type}. Valid types: csv, json, config, datadog`,
          );
      }
    } catch (error) {
      this.handleError(error);
    }
  }
}
