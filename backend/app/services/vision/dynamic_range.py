"""Dynamic range estimate from the luminance distribution.

Uses the 1st/99th percentiles (instead of raw min/max) so a handful of hot or
dead pixels don't dominate the estimate. `stops` approximates the photographic
dynamic range in EV.
"""

from __future__ import annotations

import math

import numpy as np

from app.services.vision._utils import to_grayscale


def compute_dynamic_range(image: np.ndarray) -> dict:
    gray = to_grayscale(image)
    if gray.size == 0:
        return {"low": 0.0, "high": 0.0, "range": 0.0, "stops": 0.0}

    low = float(np.percentile(gray, 1))
    high = float(np.percentile(gray, 99))
    value_range = max(0.0, high - low)
    stops = round(math.log2((high + 1.0) / (low + 1.0)), 2) if high > low else 0.0

    return {
        "low": round(low, 2),
        "high": round(high, 2),
        "range": round(value_range, 2),
        "stops": stops,
    }
