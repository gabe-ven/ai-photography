"""Subject position: where the visual weight sits in the 3x3 grid."""

from __future__ import annotations

import math

import numpy as np

from app.services.composition._utils import saliency_centroid, to_gray_u8


def estimate_subject_position(image: np.ndarray) -> dict:
    gray = to_gray_u8(image)
    cx, cy = saliency_centroid(gray)
    offset = math.hypot(cx - 0.5, cy - 0.5)

    return {
        "centroid": {"x": round(cx, 3), "y": round(cy, 3)},
        "region": _region(cx, cy),
        "offset_from_center": round(offset, 3),
    }


def _region(x: float, y: float) -> str:
    col = "left" if x < 1 / 3 else "right" if x > 2 / 3 else "center"
    row = "top" if y < 1 / 3 else "bottom" if y > 2 / 3 else "middle"
    if row == "middle" and col == "center":
        return "center"
    return f"{row}-{col}"
