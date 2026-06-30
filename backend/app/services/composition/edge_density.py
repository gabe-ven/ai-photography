"""Edge density: fraction of pixels that are edges — a busyness proxy."""

from __future__ import annotations

import numpy as np

from app.services.composition._utils import canny_edges, to_gray_u8


def compute_edge_density(image: np.ndarray) -> dict:
    gray = to_gray_u8(image)
    edges = canny_edges(gray)
    density = float((edges > 0).sum()) / float(edges.size) if edges.size else 0.0

    return {
        "edge_density": round(density, 4),
        "busyness": _busyness(density),
        "regions": _region_densities(edges),
    }


def _region_densities(edges: np.ndarray) -> dict:
    """Edge-pixel fraction within five regions of the Canny edge map.

    top/bottom = upper/lower thirds, left/right = left/right thirds,
    center = central third on both axes. Each value is a float 0-1
    rounded to 4 decimals; empty slices (tiny images) default to 0.0.
    """
    height, width = edges.shape[:2]
    h3 = height // 3
    w3 = width // 3

    binary = edges > 0

    def fraction(region: np.ndarray) -> float:
        if region.size == 0:
            return 0.0
        return round(float(region.sum()) / float(region.size), 4)

    return {
        "top": fraction(binary[:h3, :]),
        "bottom": fraction(binary[height - h3 :, :]) if h3 else 0.0,
        "left": fraction(binary[:, :w3]),
        "right": fraction(binary[:, width - w3 :]) if w3 else 0.0,
        "center": fraction(binary[h3 : height - h3, w3 : width - w3]),
    }


def _busyness(density: float) -> str:
    if density < 0.05:
        return "minimal"
    if density < 0.15:
        return "moderate"
    return "busy"
