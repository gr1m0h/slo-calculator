#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { computeErrorRateThresholds, BurnRateAlerts } from "./burnRateCalculator";

const argv = yargs(hideBin(process.argv))
  .option("slo", {
    alias: "s",
    type: "number",
    default: 99.9,
    describe: "SLO target(e.g. 99.9)",
  })
  .option("sloWindow", {
    alias: "w",
    type: "number",
    default: 30,
    describe: "SLO window(days, e.g. 30)",
  })
  .option("thresholds", {
    alias: "t",
    type: "string",
    demandOption: true,
    default: '{"1_5":14.4,"6_30":6,"24_120":3}',
    describe:
      'Burn Rate threshold mapping (JSON format, e.g.\'{"1_5":14.4,"6_30":6,"24_120":3}\'',
  })
  .parseSync();

const slo = argv.slo as number;
const sloWindowDays = argv.sloWindow as number;
let burnRateThresholds: BurnRateAlerts;
try {
  burnRateThresholds = JSON.parse(argv.thresholds as string);
} catch (error) {
  console.error("JSON parsing of thresholds failed. Please provide valid JSON.");
  process.exit(1);
}

const thresholds = computeErrorRateThresholds(slo, sloWindowDays, burnRateThresholds);

console.log(`Error rate thresholds for SLO ${slo}%:`);
for (const key in thresholds) {
  if (thresholds.hasOwnProperty(key)) {
    const parts = key.split('_');
    const longLabel = `${parts[0]}h`;
    const shortLabel = `${parts[1]}min`;
    const longValue = thresholds[key].long;
    const shortValue = thresholds[key].short;
    console.log(`  ${longLabel}: ${longValue.toFixed(6)} (${(longValue * 100).toFixed(4)}%), ${shortLabel}: ${shortValue.toFixed(6)} (${(shortValue * 100).toFixed(4)}%)`);
  }
}
