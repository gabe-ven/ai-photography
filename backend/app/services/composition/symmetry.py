"""Symmetry: compares each half of the image against its mirror via SSIM."""

from __future__ import annotations

import numpy as np
from skimage.metrics import structural_similarity as ssim

from app.services.composition._utils import clamp01, to_gray_u8

_SYMMETRIC_THRESHOLD = 0.8


def analyze_symmetry(image: np.ndarray) -> dict:
    gray = to_gray_u8(image)
    height, width = gray.shape

    vertical = _mirror_score(gray, axis="vertical") if width >= 2 else 1.0
    horizontal = _mirror_score(gray, axis="horizontal") if height >= 2 else 1.0

    dominant_axis = "vertical" if vertical >= horizontal else "horizontal"
    return {
        "vertical": round(vertical, 3),
        "horizontal": round(horizontal, 3),
        "is_symmetric": bool(max(vertical, horizontal) >= _SYMMETRIC_THRESHOLD),
        "dominant_axis": dominant_axis,
    }


def _mirror_score(gray: np.ndarray, *, axis: str) -> float:
    """1.0 == perfect mirror symmetry (structurally identical), 0.0-ish == not.

    Uses SSIM (structural similarity) rather than raw mean-brightness
    difference. Mean-diff can't distinguish "same average tone" from
    "actually mirrors" — e.g. a flat sky and a textured region with the same
    mean brightness would score as symmetric under mean-diff, even though
    they're structurally unrelated. SSIM compares local luminance, contrast,
    and structure, so it doesn't produce that false positive.
    """
    if axis == "vertical":
        width = gray.shape[1]
        half = width // 2
        a = gray[:, :half]
        b = np.fliplr(gray[:, width - half :])
    else:
        height = gray.shape[0]
        half = height // 2
        a = gray[:half, :]
        b = np.flipud(gray[height - half :, :])

    if a.size == 0 or b.size == 0:
        return 1.0

    # SSIM's sliding window needs an odd size no larger than either dimension.
    # Below that, structural comparison isn't meaningful — fall back to an
    # exact-match check.
    win_size = min(7, a.shape[0], a.shape[1])
    if win_size % 2 == 0:
        win_size -= 1
    if win_size < 3:
        return 1.0 if np.array_equal(a, b) else 0.0

    score = ssim(a, b, data_range=255, win_size=win_size)
    return clamp01(float(score))
