"""Negative space: fraction of the frame that is smooth / low-detail.

The raw measure is the share of low-gradient pixels across the whole frame.
That over-counts when a flat region happens to be the subject itself (e.g. a
solid-color shirt). When a subject is localized, we also report a
subject-excluded ratio that drops the subject's own footprint (mask if
available, else bbox) from the low-gradient pixels — closer to the
photographic definition of empty space *around* the subject.

Both numbers are returned so the two definitions can be compared on real photos
before either becomes the canonical metric.
"""

from __future__ import annotations

import cv2
import numpy as np

from app.services.composition._utils import gradient_magnitude, to_gray_u8
from app.services.composition.subject import Subject

# Gradient magnitude (after denoising) below this is treated as flat/empty area.
# Tuned for blurred-then-Sobel: JPEG noise drops to 1-5 after 5×5 Gaussian,
# while real texture (stone, foliage) stays above 15-20.
_FLAT_THRESHOLD = 15.0
_SIGNIFICANT_THRESHOLD = 0.6


def estimate_negative_space(
    image: np.ndarray, subject: Subject | None = None
) -> dict:
    gray = to_gray_u8(image)
    # Blur before computing gradient to suppress JPEG compression noise.
    # Without this, subtle sky/background gradients exceed _FLAT_THRESHOLD and
    # negative_space_ratio badly underestimates flat regions (e.g. open sky).
    denoised = cv2.GaussianBlur(gray, (5, 5), 0)
    mag = gradient_magnitude(denoised)

    if mag.size == 0:
        return {
            "negative_space_ratio": 0.0,
            "subject_excluded_ratio": 0.0,
            "has_significant_negative_space": False,
        }

    low_gradient = mag < _FLAT_THRESHOLD
    raw_ratio = float(low_gradient.mean())

    footprint = _subject_footprint(subject, mag.shape)
    if footprint is not None:
        excluded = low_gradient & ~footprint
        excluded_ratio = float(excluded.mean())
    else:
        excluded_ratio = raw_ratio

    return {
        "negative_space_ratio": round(raw_ratio, 3),
        "subject_excluded_ratio": round(excluded_ratio, 3),
        "has_significant_negative_space": bool(raw_ratio > _SIGNIFICANT_THRESHOLD),
    }


def _subject_footprint(
    subject: Subject | None, shape: tuple[int, int]
) -> np.ndarray | None:
    """Boolean mask of the subject's footprint, or ``None`` when there's none.

    Prefers the segmentation mask; falls back to the bounding box. A
    centroid-only (saliency) subject has no reliable footprint, so we return
    ``None`` and leave the raw ratio unchanged.
    """
    if subject is None:
        return None

    if subject.mask is not None and subject.mask.shape == shape:
        return subject.mask

    if subject.bbox is not None:
        return _bbox_mask(subject.bbox, shape)

    return None


def _bbox_mask(
    bbox: tuple[float, float, float, float], shape: tuple[int, int]
) -> np.ndarray | None:
    height, width = shape
    x0, y0, x1, y1 = bbox
    px0 = int(round(x0 * (width - 1)))
    px1 = int(round(x1 * (width - 1)))
    py0 = int(round(y0 * (height - 1)))
    py1 = int(round(y1 * (height - 1)))

    px0, px1 = sorted((max(0, px0), min(width, px1)))
    py0, py1 = sorted((max(0, py0), min(height, py1)))
    if px1 <= px0 or py1 <= py0:
        return None

    mask = np.zeros(shape, dtype=bool)
    mask[py0:py1, px0:px1] = True
    return mask
