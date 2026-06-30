"""Horizon detection via vertical-gradient row projection.

A horizon is a strong, sustained horizontal edge. We project the vertical
gradient onto the y-axis and look for a dominant row. Tilt is estimated by
comparing the peak row in the left vs. right half of the frame.
"""

from __future__ import annotations

import math

import cv2
import numpy as np

from app.services.composition._utils import to_gray_u8

_STRENGTH_THRESHOLD = 4.0  # peak row energy vs. mean
_LEVEL_TOLERANCE_DEG = 3.0


def detect_horizon(image: np.ndarray) -> dict:
    gray = to_gray_u8(image).astype(np.float64)
    height, width = gray.shape

    not_found = {
        "horizon_detected": False,
        "horizon_y": None,
        "is_level": False,
        "tilt_angle": None,
    }
    if height < 3 or width < 3:
        return not_found

    sobel_y = np.abs(cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3))
    row_energy = sobel_y.sum(axis=1)
    mean_energy = float(row_energy.mean())
    if mean_energy <= 0:
        return not_found

    peak = int(np.argmax(row_energy))
    strength = float(row_energy[peak] / mean_energy)
    if strength < _STRENGTH_THRESHOLD:
        return not_found

    half = width // 2
    left_peak = int(np.argmax(sobel_y[:, :half].sum(axis=1)))
    right_peak = int(np.argmax(sobel_y[:, half:].sum(axis=1)))
    tilt = math.degrees(math.atan2(right_peak - left_peak, max(half, 1)))

    return {
        "horizon_detected": True,
        "horizon_y": round(peak / max(height - 1, 1), 3),
        "is_level": bool(abs(tilt) <= _LEVEL_TOLERANCE_DEG),
        "tilt_angle": round(tilt, 2),
    }
