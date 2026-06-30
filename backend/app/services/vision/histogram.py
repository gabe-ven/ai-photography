"""Per-channel RGB histogram."""

from __future__ import annotations

import numpy as np

from app.services.vision._utils import to_rgb


def compute_histogram(image: np.ndarray, bins: int = 256) -> dict:
    """Return bin counts for each channel: {"bins", "r", "g", "b"}."""
    rgb = to_rgb(image)
    out: dict = {"bins": bins}
    for index, channel in enumerate(("r", "g", "b")):
        counts, _ = np.histogram(rgb[:, :, index], bins=bins, range=(0, 255))
        out[channel] = counts.astype(int).tolist()
    return out
