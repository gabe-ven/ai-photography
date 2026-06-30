"""Rule of thirds: how well the visual weight sits on a power point.

Uses the gradient-energy centroid as a stand-in for the subject and measures
its distance to the nearest rule-of-thirds intersection.
"""

from __future__ import annotations

import numpy as np

from app.services.composition._utils import (
    clamp01,
    nearest_power_point,
    saliency_centroid,
    to_gray_u8,
)

# Distance (normalized) from a power point to the dead center — used to scale
# the score so a centered subject maps to ~0 and an on-point subject to ~1.
_CENTER_DISTANCE = ((0.5 - 1 / 3) ** 2 * 2) ** 0.5
_FOLLOWS_THRESHOLD = 0.12


def analyze_rule_of_thirds(image: np.ndarray) -> dict:
    gray = to_gray_u8(image)
    cx, cy = saliency_centroid(gray)
    (px, py), distance = nearest_power_point(cx, cy)

    score = clamp01(1.0 - distance / _CENTER_DISTANCE)
    return {
        "score": round(float(score), 3),
        "follows_rule": bool(distance < _FOLLOWS_THRESHOLD),
        "centroid": {"x": round(cx, 3), "y": round(cy, 3)},
        "nearest_power_point": {"x": round(px, 3), "y": round(py, 3)},
        "distance_to_power_point": round(float(distance), 3),
    }
