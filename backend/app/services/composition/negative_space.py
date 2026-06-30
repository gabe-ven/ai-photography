"""Negative space: fraction of the frame that is smooth / low-detail."""

from __future__ import annotations

import numpy as np

from app.services.composition._utils import gradient_magnitude, to_gray_u8

# Gradient magnitude below this is treated as flat/empty area.
_FLAT_THRESHOLD = 15.0
_SIGNIFICANT_THRESHOLD = 0.6


def estimate_negative_space(image: np.ndarray) -> dict:
    gray = to_gray_u8(image)
    mag = gradient_magnitude(gray)
    ratio = float((mag < _FLAT_THRESHOLD).mean()) if mag.size else 0.0

    return {
        "negative_space_ratio": round(ratio, 3),
        "has_significant_negative_space": bool(ratio > _SIGNIFICANT_THRESHOLD),
    }
