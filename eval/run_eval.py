#!/usr/bin/env python3
"""Composition-analysis evaluation harness.

Runs run_composition_analysis() against a labeled set of real photos and
checks the output against your own judgment calls (ground_truth.json), so
"is this metric accurate" becomes a measured pass/fail table instead of an
eyeballed screenshot.

Usage:
    python eval/run_eval.py

Setup:
    1. Drop real JPEGs into eval/photos/
    2. For each photo, add an entry to eval/ground_truth.json describing
       what YOU judge to be true about it (see ground_truth.example.json
       for the schema and field meanings).
    3. Run this script. Photos with no ground_truth entry are skipped
       with a warning, not silently ignored.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Make the backend package importable when running from repo root or eval/.
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "backend"))

from PIL import Image  # noqa: E402

from app.services.composition.composition_pipeline import (  # noqa: E402
    run_composition_analysis,
)

EVAL_DIR = Path(__file__).resolve().parent
PHOTOS_DIR = EVAL_DIR / "photos"
GROUND_TRUTH_PATH = EVAL_DIR / "ground_truth.json"


# ---------------------------------------------------------------------------
# Per-axis checks: each returns (passed: bool, expected: str, actual: str)
# or None if this axis has no ground-truth judgment for this photo.
# ---------------------------------------------------------------------------


def check_rule_of_thirds(result: dict, gt: dict) -> tuple[bool, str, str] | None:
    if "on_power_point" not in gt:
        return None
    expected = gt["on_power_point"]
    actual = result["rule_of_thirds"]["follows_rule"]
    return actual == expected, str(expected), str(actual)


def check_leading_lines(result: dict, gt: dict) -> tuple[bool, str, str] | None:
    if "has_leading_lines" not in gt:
        return None
    expected = gt["has_leading_lines"]
    actual = result["leading_lines"]["has_leading_lines"]
    passed = actual == expected
    expected_str = str(expected)
    actual_str = str(actual)

    # A plain has_leading_lines boolean can be "right for the wrong reason" —
    # e.g. it can come back True because it found foliage clutter, not the
    # real staircase/architectural lines you actually meant. If you gave an
    # expected angle, check the detector landed in the right direction too.
    if expected and "expected_dominant_angle_deg" in gt:
        tolerance = gt.get("angle_tolerance_deg", 20)
        actual_angle = result["leading_lines"]["dominant_angle"]
        expected_angle = gt["expected_dominant_angle_deg"]
        angle_ok = (
            actual_angle is not None
            and _angle_diff(actual_angle, expected_angle) <= tolerance
        )
        passed = passed and angle_ok
        expected_str += f" @ ~{expected_angle}°"
        actual_str += f" @ {actual_angle}°"

    return passed, expected_str, actual_str


def _angle_diff(a: float, b: float) -> float:
    """Smallest difference between two angles in [0, 180) space."""
    diff = abs(a - b) % 180
    return min(diff, 180 - diff)


def check_symmetry(result: dict, gt: dict) -> tuple[bool, str, str] | None:
    if "is_symmetric" not in gt:
        return None
    expected = gt["is_symmetric"]
    actual = result["symmetry"]["is_symmetric"]
    passed = actual == expected
    expected_str = str(expected)
    actual_str = str(actual)

    if expected and "dominant_axis" in gt:
        axis_match = result["symmetry"]["dominant_axis"] == gt["dominant_axis"]
        passed = passed and axis_match
        expected_str += f" ({gt['dominant_axis']})"
        actual_str += f" ({result['symmetry']['dominant_axis']})"

    return passed, expected_str, actual_str


def check_horizon(result: dict, gt: dict) -> tuple[bool, str, str] | None:
    if "has_horizon" not in gt:
        return None
    expected = gt["has_horizon"]
    actual = result["horizon"]["horizon_detected"]
    return actual == expected, str(expected), str(actual)


def check_negative_space(result: dict, gt: dict) -> tuple[bool, str, str] | None:
    if "has_significant_negative_space" not in gt:
        return None
    expected = gt["has_significant_negative_space"]
    actual = result["negative_space"]["has_significant_negative_space"]
    return actual == expected, str(expected), str(actual)


def check_subject_region(result: dict, gt: dict) -> tuple[bool, str, str] | None:
    if "expected_region" not in gt:
        return None
    expected = gt["expected_region"]
    actual = result["subject_position"]["region"]
    return actual == expected, expected, actual


CHECKS = {
    "rule_of_thirds": check_rule_of_thirds,
    "leading_lines": check_leading_lines,
    "symmetry": check_symmetry,
    "horizon": check_horizon,
    "negative_space": check_negative_space,
    "subject_position": check_subject_region,
}


def load_ground_truth() -> dict:
    if not GROUND_TRUTH_PATH.exists():
        print(f"No ground_truth.json found at {GROUND_TRUTH_PATH}")
        print("Copy ground_truth.example.json to ground_truth.json and fill it in.")
        sys.exit(1)
    return json.loads(GROUND_TRUTH_PATH.read_text())


def main() -> None:
    ground_truth = load_ground_truth()
    photos = sorted(PHOTOS_DIR.glob("*"))
    photos = [p for p in photos if p.suffix.lower() in {".jpg", ".jpeg", ".png"}]

    if not photos:
        print(f"No photos found in {PHOTOS_DIR}. Add some real JPEGs there.")
        sys.exit(1)

    axis_totals: dict[str, int] = {k: 0 for k in CHECKS}
    axis_passed: dict[str, int] = {k: 0 for k in CHECKS}

    rows: list[tuple[str, str, str, bool]] = []

    for photo_path in photos:
        name = photo_path.name
        gt = ground_truth.get(name)
        if gt is None:
            print(f"⚠️  Skipping {name} — no ground_truth.json entry")
            continue

        image = Image.open(photo_path)
        result = run_composition_analysis(image)

        for axis, check_fn in CHECKS.items():
            outcome = check_fn(result, gt)
            if outcome is None:
                continue  # no judgment given for this axis on this photo
            passed, expected, actual = outcome
            axis_totals[axis] += 1
            axis_passed[axis] += int(passed)
            rows.append((name, axis, f"expected={expected} actual={actual}", passed))

    # --- per-check table ---
    print("\n" + "=" * 78)
    print(f"{'PHOTO':<28} {'AXIS':<18} {'DETAIL':<26} {'RESULT'}")
    print("=" * 78)
    for name, axis, detail, passed in rows:
        mark = "✅ PASS" if passed else "❌ FAIL"
        print(f"{name:<28} {axis:<18} {detail:<26} {mark}")

    # --- summary ---
    print("\n" + "=" * 78)
    print("SUMMARY BY AXIS")
    print("=" * 78)
    total_checks = 0
    total_passed = 0
    for axis in CHECKS:
        t, p = axis_totals[axis], axis_passed[axis]
        total_checks += t
        total_passed += p
        if t == 0:
            print(f"{axis:<20} no ground-truth judgments provided")
            continue
        pct = 100 * p / t
        print(f"{axis:<20} {p}/{t}  ({pct:.0f}%)")

    print("-" * 78)
    if total_checks:
        print(f"{'OVERALL':<20} {total_passed}/{total_checks}  "
              f"({100 * total_passed / total_checks:.0f}%)")
    print("=" * 78 + "\n")


if __name__ == "__main__":
    main()
