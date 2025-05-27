# SLO Calculator

A command-line tool for calculating Service Level Objectives (SLOs) with manual adjustments for external service impacts. Designed for SRE teams to track true internal reliability by excluding third-party service failures.

## Features

- 📊 **Accurate SLO Tracking** - Exclude external service impacts for true internal reliability metrics
- 💰 **Error Budget Management** - Track consumption, burn rate, and projected exhaustion
- 📈 **Comprehensive Reporting** - Generate detailed reports in Markdown or JSON format
- 🔄 **External Impact Tracking** - Document and exclude third-party service failures
- 📱 **Slack Integration** - Automated alerts for critical SLO violations
- 🚀 **Easy Integration** - Import data from Datadog, CSV, or JSON sources

## Installation

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn

### From Source

```bash
# Clone the repository
git clone https://github.com/your-org/slo-calculator.git
cd slo-calculator

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

### Quick Start

```bash
# Initialize data directory
slo-calc init

# Generate a CSV template
slo-calc template

# Import your data
slo-calc import sli-data.csv api-service

# Calculate SLO
slo-calc calculate api-service --target 99.9 --window 30
```

## Usage

### Commands

#### `init`

Initialize the SLO data directory structure.

```bash
slo-calc init [--data-dir ./custom-path]
```

#### `import`

Import SLI data from CSV or JSON files.

```bash
slo-calc import <file> <service-name> [options]

Options:
  --merge        Merge with existing data instead of replacing
  --no-validate  Skip data validation
```

#### `calculate`

Calculate SLO and Error Budget for a service.

```bash
slo-calc calculate <service-name> [options]

Options:
  -t, --target <percentage>  SLO target percentage (default: "99.9")
  -w, --window <days>        Rolling window in days (default: "30")
  -f, --format <format>      Output format: markdown|json (default: "markdown")
  --slack                    Send report to Slack
```

#### `template`

Generate template files for data import.

```bash
slo-calc template [options]

Options:
  --type <type>    Template type: csv|json|config|datadog (default: "csv")
  --output <file>  Output file path
```

#### `validate`

Validate SLI data file format and content.

```bash
slo-calc validate <file>
```

#### `archive`

Archive old reports to save space.

```bash
slo-calc archive [options]

Options:
  --days <days>  Days to keep reports (default: "90")
```

### Data Format

#### CSV Format

```csv
date,totalRequests,successfulRequests,excludedFailures,reason
2024-01-01,100000,99900,50,AWS outage
2024-01-02,100000,99950,0,
2024-01-03,100000,99800,100,External API timeout
```

#### JSON Format

```json
[
  {
    "date": "2024-01-01",
    "totalRequests": 100000,
    "successfulRequests": 99900,
    "excludedFailures": 50,
    "reason": "AWS outage"
  }
]
```

### Environment Variables

```bash
# Slack webhook for notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Datadog API credentials (for fetch-datadog.sh)
DD_API_KEY=your-api-key
DD_APP_KEY=your-app-key

# Custom data directory (optional)
SLO_DATA_DIR=/path/to/slo-data
```

## Example Workflow

### Daily SLO Update

```bash
#!/bin/bash
# daily-slo-update.sh

SERVICE="api-service"
DATE=$(date -d "yesterday" +%Y-%m-%d)

# 1. Fetch data from monitoring system
./fetch-datadog.sh $SERVICE $DATE

# 2. Review and add external impacts
echo "Review: sli-$SERVICE-$DATE.csv"
vim sli-$SERVICE-$DATE.csv

# 3. Import and calculate
slo-calc import --merge sli-$SERVICE-$DATE.csv $SERVICE
slo-calc calculate $SERVICE --format markdown --slack

# 4. Archive old reports
slo-calc archive --days 90
```

### Datadog Integration

Generate a Datadog fetch script:

```bash
slo-calc template --type datadog --output fetch-datadog.sh
chmod +x fetch-datadog.sh
```

## Report Example

```markdown
# SLO Report: api-service

## Summary

- **Period**: 2024-01-01 to 2024-01-30 (30 days)
- **Target SLO**: 99.90%
- **Raw SLI**: 99.850%
- **Adjusted SLI**: 99.920% (External impacts excluded)

## Error Budget

- **Total Budget**: 0.100%
- **Consumed**: 0.080%
- **Remaining**: 0.020% (20.0%)
- **Daily Burn Rate**: 0.0027%

## Recommendations

- ⚠️ **Warning**: Error budget is below 20%. Freeze non-critical deployments.
- 📊 **Caution**: Error budget below 50%. Review deployment practices.
```

## Architecture

```
slo-calculator/
├── src/
│   ├── core/          # Core calculation logic
│   ├── commands/      # CLI command implementations
│   ├── io/            # Data import/export
│   ├── analysis/      # Recommendation engine
│   ├── utils/         # Utilities and validators
│   ├── integrations/  # External service integrations
│   └── types/         # TypeScript type definitions
├── dist/              # Compiled JavaScript
├── slo-data/          # Data directory (created by init)
│   ├── input/         # SLI data files
│   ├── reports/       # Generated reports
│   └── archive/       # Archived reports
└── package.json
```

## Key Concepts

### Error Budget

The Error Budget represents the maximum amount of downtime or errors your service can have while still meeting its SLO. It's calculated as:

- Total Budget = (1 - SLO Target) × 100
- Consumed = (SLO Target - Current SLI) × 100
- Remaining = Total - Consumed

### Adjusted SLI

The Adjusted SLI excludes failures caused by external dependencies, providing a clearer picture of your service's internal reliability. This helps teams focus on improvements within their control.

### Burn Rate

The rate at which your Error Budget is being consumed. A burn rate > 1 means you'll exhaust your budget before the window ends.

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Project Structure

- `src/core/` - Core business logic for SLO calculations
- `src/commands/` - CLI command implementations
- `src/io/` - Data import/export functionality
- `src/analysis/` - Recommendation and analysis engine
- `src/utils/` - Utility functions and validators
- `src/integrations/` - External service integrations
- `src/types/` - TypeScript type definitions

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Google's SRE practices and Error Budget methodology
- Built for modern SRE teams managing complex service dependencies
- Designed for seamless integration with existing monitoring workflows
