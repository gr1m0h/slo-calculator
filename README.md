# slo-burn

CLI tool that calculates error rate thresholds for each burn rate alert time window based on SLO values ​​and burn rate alert settings.

## Installation

```sh
npm install -g slo-burn
```

## Usage

```sh
npx slo-burn --slo 99 --sloWindow 30 --thresholds '{"1_5":14.4,"6_30":6,"24_120":3}'
```
