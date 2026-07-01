"""Dominant colors via k-means clustering of the pixels."""

from __future__ import annotations

import cv2
import numpy as np

# k-means accuracy doesn't require every pixel — sample this many at most.
# 4096 gives stable cluster results while being orders of magnitude faster
# than running k-means on a full 26 MP image.
_MAX_PIXELS_FOR_KMEANS = 4096


def dominant_colors(image: np.ndarray, k: int = 5) -> list[dict]:
    """Return up to `k` dominant colors, sorted by coverage (most first).

    Each entry: {"hex": "#rrggbb", "rgb": [r, g, b], "proportion": 0–1}.
    `k` is clamped to the number of distinct colors so tiny/flat images work.
    """
    from app.services.vision._utils import to_rgb

    rgb = to_rgb(image)
    pixels = rgb.reshape(-1, 3)
    if pixels.size == 0:
        return []

    # Subsample for large images before running k-means.
    if len(pixels) > _MAX_PIXELS_FOR_KMEANS:
        rng = np.random.default_rng(seed=42)
        idx = rng.choice(len(pixels), size=_MAX_PIXELS_FOR_KMEANS, replace=False)
        pixels = pixels[idx]

    distinct, distinct_counts = np.unique(pixels, axis=0, return_counts=True)

    # When there are at most `k` distinct colors (flat or tiny images), report
    # them exactly. kmeans is only well-posed — and only needed — when the
    # palette is larger than the cluster count.
    if len(distinct) <= k:
        centers = distinct.astype(np.float32)
        counts = distinct_counts
    else:
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
        _, labels, centers = cv2.kmeans(
            pixels.astype(np.float32), k, None, criteria, 3, cv2.KMEANS_PP_CENTERS
        )
        counts = np.bincount(labels.flatten(), minlength=k)

    total = int(counts.sum())
    result: list[dict] = []
    for idx in np.argsort(counts)[::-1]:
        r, g, b = (int(np.clip(round(float(c)), 0, 255)) for c in centers[idx])
        result.append(
            {
                "hex": f"#{r:02x}{g:02x}{b:02x}",
                "rgb": [r, g, b],
                "proportion": round(float(counts[idx] / total), 4),
            }
        )
    return result
