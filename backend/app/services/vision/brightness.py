"""Average brightness: mean luminance on a 0–255 scale."""

from __future__ import annotations

import numpy as np

from app.services.vision._utils import to_grayscale


def compute_brightness(image: np.ndarray) -> float:
    gray = to_grayscale(image)
    if gray.size == 0:
        return 0.0
    return round(float(gray.mean()), 2)
