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

### help

```sh
> npx slo-burn --help
Options:
      --help        Show help                                         [boolean]
      --version     Show version number                               [boolean]
  -s, --slo         SLO target(e.g. 99.9)              [number] [default: 99.9]
  -w, --sloWindow   SLO window(days, e.g. 30)            [number] [default: 30]
  -t, --thresholds  Burn Rate threshold mapping (JSON format,
                    e.g.'{"1_5":14.4,"6_30":6,"24_120":3}'
              [string] [required] [default: "{"1_5":14.4,"6_30":6,"24_120":3}"]
```
