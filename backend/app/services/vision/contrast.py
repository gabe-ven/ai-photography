"""Contrast score: standard deviation of luminance (0–~127)."""

from __future__ import annotations

import numpy as np

from app.services.vision._utils import to_grayscale


def compute_contrast(image: np.ndarray) -> float:
    gray = to_grayscale(image)
    if gray.size == 0:
        return 0.0
    return round(float(gray.std()), 2)
