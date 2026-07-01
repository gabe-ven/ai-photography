#!/usr/bin/env python3
"""Manual smoke test for the subject-localization stage.

Runs `locate_subject` on a single image, prints the resulting Subject, and
writes a debug image with the bounding box (and mask overlay, if present) to
/tmp/subject_debug.png.

This is a developer convenience for eyeballing detector output — it is NOT
wired into the pipeline or the test suite.

Usage:
    python scripts/smoke_test_subject.py path/to/photo.jpg
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

# Make the backend package importable when running from the repo root.
_BACKEND = Path(__file__).resolve().parent.parent / "backend"
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from app.services.composition.subject import Subject  # noqa: E402
from app.services.composition.subject_localization import (  # noqa: E402
    locate_subject_with_diagnostics,
)

_OUTPUT_PATH = Path("/tmp/subject_debug.png")
_BOX_COLOR = np.array([245, 158, 11], dtype=np.float64)  # amber
_MASK_ALPHA = 0.45


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(f"Usage: {argv[0]} <image_path>", file=sys.stderr)
        return 2

    image_path = Path(argv[1])
    if not image_path.exists():
        print(f"Image not found: {image_path}", file=sys.stderr)
        return 2

    image = Image.open(image_path).convert("RGB")
    rgb = np.asarray(image)

    subject, decision = locate_subject_with_diagnostics(rgb)
    _print_subject(subject)
    _print_decision(decision)

    debug = _render_debug(rgb, subject)
    Image.fromarray(debug).save(_OUTPUT_PATH)
    print(f"\nWrote debug image to {_OUTPUT_PATH}")
    return 0


def _print_decision(decision: dict) -> None:
    tier = decision.get("tier", "unknown")
    reason = decision.get("reason", "no decision recorded")
    print(f"\nTier fired : {tier}")
    print(f"Reason     : {reason}")


def _print_subject(subject: Subject) -> None:
    cx, cy = subject.centroid
    print("Subject")
    print(f"  source     : {subject.source}")
    print(f"  label      : {subject.label}")
    print(f"  confidence : {subject.confidence:.3f}")
    if subject.bbox is None:
        print("  bbox       : None")
    else:
        x0, y0, x1, y1 = subject.bbox
        print(f"  bbox       : ({x0:.3f}, {y0:.3f}, {x1:.3f}, {y1:.3f})")
    print(f"  centroid   : ({cx:.3f}, {cy:.3f})")
    print(f"  has_mask   : {subject.has_mask}")


def _render_debug(rgb: np.ndarray, subject: Subject) -> np.ndarray:
    canvas = rgb.astype(np.float64).copy()
    height, width = canvas.shape[:2]

    # Semi-transparent mask overlay.
    if subject.mask is not None and subject.mask.shape == (height, width):
        sel = subject.mask
        canvas[sel] = (1 - _MASK_ALPHA) * canvas[sel] + _MASK_ALPHA * _BOX_COLOR

    # Bounding box outline.
    if subject.bbox is not None:
        x0, y0, x1, y1 = subject.bbox
        px0 = int(round(x0 * (width - 1)))
        px1 = int(round(x1 * (width - 1)))
        py0 = int(round(y0 * (height - 1)))
        py1 = int(round(y1 * (height - 1)))
        thickness = max(2, round(min(width, height) / 200))
        _draw_box(canvas, px0, py0, px1, py1, thickness)

    # Centroid crosshair.
    cx = int(round(subject.centroid[0] * (width - 1)))
    cy = int(round(subject.centroid[1] * (height - 1)))
    _draw_crosshair(canvas, cx, cy, size=max(4, round(min(width, height) / 40)))

    return np.clip(canvas, 0, 255).astype(np.uint8)


def _draw_box(
    canvas: np.ndarray, x0: int, y0: int, x1: int, y1: int, thickness: int
) -> None:
    height, width = canvas.shape[:2]
    x0, x1 = sorted((max(0, x0), min(width - 1, x1)))
    y0, y1 = sorted((max(0, y0), min(height - 1, y1)))
    canvas[y0 : y0 + thickness, x0 : x1 + 1] = _BOX_COLOR
    canvas[y1 - thickness + 1 : y1 + 1, x0 : x1 + 1] = _BOX_COLOR
    canvas[y0 : y1 + 1, x0 : x0 + thickness] = _BOX_COLOR
    canvas[y0 : y1 + 1, x1 - thickness + 1 : x1 + 1] = _BOX_COLOR


def _draw_crosshair(canvas: np.ndarray, cx: int, cy: int, size: int) -> None:
    height, width = canvas.shape[:2]
    x0 = max(0, cx - size)
    x1 = min(width, cx + size + 1)
    y0 = max(0, cy - size)
    y1 = min(height, cy + size + 1)
    if 0 <= cy < height:
        canvas[cy, x0:x1] = _BOX_COLOR
    if 0 <= cx < width:
        canvas[y0:y1, cx] = _BOX_COLOR


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
