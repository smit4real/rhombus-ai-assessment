#!/usr/bin/env python3
import argparse
import csv
import sys
from typing import List

# Minimal expected columns after transformation – adjust for your data.
EXPECTED_COLUMNS: List[str] = [
    "longname",
    "nationality",
    "age",
    "team_contract",
    "value",
    "wage",
]

def read_csv(path: str):
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        rows = list(reader)
    if not rows:
        raise AssertionError(f"{path}: file is empty")
    header = rows[0]
    row_count = len(rows) - 1
    return header, row_count

def main():
    parser = argparse.ArgumentParser(description="Validate Rhombus AI transformed CSV output.")
    parser.add_argument("--input", required=True, help="Path to original input CSV")
    parser.add_argument("--output", required=True, help="Path to transformed output CSV")
    parser.add_argument(
        "--max-row-loss",
        type=float,
        default=0.05,
        help="Allowed fraction of rows lost (e.g. from duplicate removal). Default 0.05 (5%).",
    )
    args = parser.parse_args()

    input_header, input_rows = read_csv(args.input)
    output_header, output_rows = read_csv(args.output)

    print(f"Input rows : {input_rows}")
    print(f"Output rows: {output_rows}")

    # Basic header normalization
    normalized_output = [col.strip().lower().replace(" ", "_") for col in output_header]

    missing_cols = [col for col in EXPECTED_COLUMNS if col not in normalized_output]
    if missing_cols:
        raise AssertionError(f"Missing expected columns in output: {missing_cols}")

    if output_rows > input_rows:
        raise AssertionError("Output has more rows than input; unexpected data amplification")

    allowed_loss = int(input_rows * args.max-row_loss)  # intentionally simple
    min_rows = input_rows - allowed_loss

    if output_rows < min_rows:
        raise AssertionError(
            f"Too many rows lost. Input={input_rows}, Output={output_rows}, "
            f"allowed loss={allowed_loss}"
        )

    print("Data validation passed.")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except AssertionError as e:
        print(f"VALIDATION FAILED: {e}", file=sys.stderr)
        sys.exit(1)
