"""Shared helpers for the composition analyzers.

Keeps each analyzer module small and focused. All helpers are pure.
"""

from __future__ import annotations

import cv2
import numpy as np

# Rule-of-thirds "power points" in normalized (x, y) coordinates.
POWER_POINTS: tuple[tuple[float, float], ...] = (
    (1 / 3, 1 / 3),
    (2 / 3, 1 / 3),
    (1 / 3, 2 / 3),
    (2 / 3, 2 / 3),
)


def to_gray_u8(image: np.ndarray) -> np.ndarray:
    """Return an (H, W) uint8 grayscale array from grayscale or color input."""
    arr = np.asarray(image)
    if arr.ndim == 2:
        gray = arr.astype(np.float64)
    elif arr.ndim == 3:
        rgb = arr[:, :, :3].astype(np.float64)
        gray = rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114
    else:
        raise ValueError(f"Unsupported image shape: {arr.shape}")
    return np.clip(gray, 0, 255).astype(np.uint8)


def gradient_magnitude(gray_u8: np.ndarray) -> np.ndarray:
    """Sobel gradient magnitude as float64 — a cheap saliency proxy."""
    gx = cv2.Sobel(gray_u8, cv2.CV_64F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray_u8, cv2.CV_64F, 0, 1, ksize=3)
    return np.sqrt(gx * gx + gy * gy)


def canny_edges(gray_u8: np.ndarray) -> np.ndarray:
    return cv2.Canny(gray_u8, 50, 150)


def saliency_centroid(gray_u8: np.ndarray) -> tuple[float, float]:
    """Normalized (x, y) center of mass of gradient energy.

    Falls back to the image center (0.5, 0.5) when there's no detail.
    """
    mag = gradient_magnitude(gray_u8)
    total = float(mag.sum())
    if total <= 0:
        return 0.5, 0.5

    height, width = mag.shape
    ys, xs = np.indices(mag.shape)
    cx = float((xs * mag).sum() / total) / max(width - 1, 1)
    cy = float((ys * mag).sum() / total) / max(height - 1, 1)
    return cx, cy


def nearest_power_point(x: float, y: float) -> tuple[tuple[float, float], float]:
    """Return the closest power point and the Euclidean distance to it."""
    best = POWER_POINTS[0]
    best_dist = float("inf")
    for px, py in POWER_POINTS:
        dist = ((x - px) ** 2 + (y - py) ** 2) ** 0.5
        if dist < best_dist:
            best, best_dist = (px, py), dist
    return best, best_dist


def clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))
