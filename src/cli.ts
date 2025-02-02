#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { calculate } from "./calculator";

const argv = yargs(hideBin(process.argv))
  .option("target", {
    alias: "t",
    type: "number",
    default: 99.9,
    describe: "SLO target(e.g. 99.9)",
  })
  .option("window", {
    alias: "w",
    type: "number",
    default: 30,
    describe: "SLO window(day, e.g. 30)",
  })
  .option("budget", {
    alias: "b",
    type: "number",
    default: 100,
    describe: "budget consumption(%, e.g. 2)",
  })
  .help()
  .alias("help", "h")
  .parseSync();

const options = {
  target: argv.target as number,
  window: argv.window as number,
  budget: argv.budget as number,
};

const results = calculate(options);

console.log(`parameter:`);
console.log(`SLO target: ${options.target}%`);
console.log(`SLO window: ${options.window}d`);
console.log(`Budget consumption: ${options.budget}%\n`);

console.log(`results:`);
console.log(`- Max Burn Rate: ${results.maxBurnRateThreshold.toFixed(2)}`);
console.log(`- Burn Rate: ${results.burnRateThreshold.toFixed(2)}`);
console.log(`- 検出までにかかる時間: ${results.detectionTime}時間`);
console.log(`- 対象ウィンドウにおける均等配分の許容エラーレート: ${(results.allowedErrorRate * 100).toFixed(4)}%`);
console.log(`- 検出時のエラーレート（エラー閾値）: ${(results.detectionErrorRate * 100).toFixed(4)}%`);
