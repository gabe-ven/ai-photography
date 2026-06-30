"""Dominant colors via k-means clustering of the pixels."""

from __future__ import annotations

import cv2
import numpy as np


def dominant_colors(image: np.ndarray, k: int = 5) -> list[dict]:
    """Return up to `k` dominant colors, sorted by coverage (most first).

    Each entry: {"hex": "#rrggbb", "rgb": [r, g, b], "proportion": 0–1}.
    `k` is clamped to the number of distinct colors so tiny/flat images work.
    """
    from app.services.vision._utils import to_rgb

    rgb = to_rgb(image)
    pixels = rgb.reshape(-1, 3).astype(np.float32)
    if pixels.size == 0:
        return []

    distinct = len(np.unique(pixels, axis=0))
    clusters = int(max(1, min(k, distinct)))

    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(
        pixels, clusters, None, criteria, 3, cv2.KMEANS_PP_CENTERS
    )

    labels = labels.flatten()
    counts = np.bincount(labels, minlength=clusters)
    total = int(counts.sum())

    result: list[dict] = []
    for idx in np.argsort(counts)[::-1]:
        r, g, b = (int(np.clip(round(c), 0, 255)) for c in centers[idx])
        result.append(
            {
                "hex": f"#{r:02x}{g:02x}{b:02x}",
                "rgb": [r, g, b],
                "proportion": round(float(counts[idx] / total), 4),
            }
        )
    return result
