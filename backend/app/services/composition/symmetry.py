"""Symmetry: compares each half of the image against its mirror."""

from __future__ import annotations

import numpy as np

from app.services.composition._utils import clamp01, to_gray_u8

_SYMMETRIC_THRESHOLD = 0.8


def analyze_symmetry(image: np.ndarray) -> dict:
    gray = to_gray_u8(image).astype(np.float64)
    height, width = gray.shape

    vertical = _mirror_score(gray, axis="vertical") if width >= 2 else 1.0
    horizontal = _mirror_score(gray, axis="horizontal") if height >= 2 else 1.0

    dominant_axis = "vertical" if vertical >= horizontal else "horizontal"
    return {
        "vertical": round(vertical, 3),
        "horizontal": round(horizontal, 3),
        "is_symmetric": bool(max(vertical, horizontal) >= _SYMMETRIC_THRESHOLD),
        "dominant_axis": dominant_axis,
    }


def _mirror_score(gray: np.ndarray, *, axis: str) -> float:
    """1.0 == perfect mirror symmetry, 0.0 == maximally different."""
    if axis == "vertical":
        width = gray.shape[1]
        half = width // 2
        a = gray[:, :half]
        b = np.fliplr(gray[:, width - half :])
    else:
        height = gray.shape[0]
        half = height // 2
        a = gray[:half, :]
        b = np.flipud(gray[height - half :, :])

    mean_diff = float(np.abs(a - b).mean()) / 255.0
    return clamp01(1.0 - mean_diff)
