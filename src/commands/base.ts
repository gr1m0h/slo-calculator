export abstract class BaseCommand {
  protected options: any;

  constructor(options: any) {
    this.options = options;
  }

  abstract execute(...args: any[]): Promise<void>;

  protected log(message: string): void {
    if (this.options.verbose) {
      console.log(`[${new Date().toISOString()}] ${message}`);
    }
  }

  protected handleError(error: any): void {
    console.error("❌ Error:", error.message);
    if (this.options.verbose && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }

  protected success(message: string): void {
    console.log(`✅ ${message}`);
  }

  protected warn(message: string): void {
    console.warn(`⚠️  ${message}`);
  }

  protected info(message: string): void {
    console.log(`ℹ️  ${message}`);
  }
}
