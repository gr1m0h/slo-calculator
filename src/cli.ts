#!/usr/bin/env node

import { computeErrorRateThresholds, BurnRateThresholds } from "./burnRateCalculator";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
  .option("slo", {
    alias: "s",
    type: "number",
    describe: "The SLO in percentage",
    demandOption: true,
  })
  .option("thresholds", {
    alias: "t",
    type: "string",
    describe: "",
    demandOption: true,
  })
  .help()
  .alias("help", "h")
  .parseSync();

const slo: number = argv.slo;
let burnRateThresholds: BurnRateThresholds;

try {
  burnRateThresholds = JSON.parse(argv.thresholds);
} catch (e) {
  console.error("Invalid thresholds JSON");
  process.exit(1);
}

const computedThresholds = computeErrorRateThresholds(slo, burnRateThresholds);

console.log(`Error rate thresholds for SLO ${slo}%:`);
for (const interval in computedThresholds) {
  if (computedThresholds.hasOwnProperty(interval)) {
    const errorRate = computedThresholds[interval];
    console.log(`  ${interval}: ${errorRate} (${(errorRate * 100).toFixed(2)}%)`);
  }
}
