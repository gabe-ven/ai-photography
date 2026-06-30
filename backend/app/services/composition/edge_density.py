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
    }


def _busyness(density: float) -> str:
    if density < 0.05:
        return "minimal"
    if density < 0.15:
        return "moderate"
    return "busy"
