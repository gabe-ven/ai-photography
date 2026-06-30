"""Sharpness score via the variance of the Laplacian.

Higher variance == more high-frequency detail == sharper. Low values suggest
blur. This is a relative metric, not an absolute one.
"""

from __future__ import annotations

import cv2
import numpy as np

from app.services.vision._utils import to_grayscale


def compute_sharpness(image: np.ndarray) -> float:
    gray = to_grayscale(image).astype(np.float64)
    if gray.size == 0:
        return 0.0
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    return round(float(laplacian.var()), 2)
