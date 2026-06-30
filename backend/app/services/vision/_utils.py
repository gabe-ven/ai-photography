"""Shared array helpers for the vision metrics.

Every metric function accepts a numpy array that may be 2D (grayscale) or 3D
(color, possibly with an alpha channel). These helpers normalize that input so
each metric stays small and pure.
"""

from __future__ import annotations

import numpy as np


def to_grayscale(image: np.ndarray) -> np.ndarray:
    """Return a float64 luminance array from a grayscale or color image.

    Uses Rec. 601 luma weights via an explicit weighted sum (not matmul, which
    can emit spurious FP warnings on some BLAS builds).
    """
    arr = np.asarray(image)
    if arr.ndim == 2:
        return arr.astype(np.float64)
    if arr.ndim == 3:
        rgb = arr[:, :, :3].astype(np.float64)
        return rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114
    raise ValueError(f"Unsupported image shape: {arr.shape}")


def to_rgb(image: np.ndarray) -> np.ndarray:
    """Return an (H, W, 3) uint8 RGB array from a grayscale or color image."""
    arr = np.asarray(image)
    if arr.ndim == 2:
        return np.stack([arr] * 3, axis=-1).astype(np.uint8)
    if arr.ndim == 3:
        return arr[:, :, :3].astype(np.uint8)
    raise ValueError(f"Unsupported image shape: {arr.shape}")
