"""Subject position: where the subject sits in the 3x3 grid.

Consumes the subject-localization output (centroid, bbox, label, confidence).
When no subject is supplied it falls back to the gradient-energy saliency
centroid, preserving the original behavior.
"""

from __future__ import annotations

import math

import numpy as np

from app.services.composition._utils import saliency_centroid, to_gray_u8
from app.services.composition.subject import Subject


def estimate_subject_position(
    image: np.ndarray, subject: Subject | None = None
) -> dict:
    if subject is not None:
        cx, cy = subject.centroid
        bbox = _bbox_dict(subject.bbox)
        label = subject.label
        confidence = round(float(subject.confidence), 3)
        has_mask = subject.has_mask
        source = subject.source
    else:
        gray = to_gray_u8(image)
        cx, cy = saliency_centroid(gray)
        bbox = None
        label = None
        confidence = 0.0
        has_mask = False
        source = "saliency"

    offset = math.hypot(cx - 0.5, cy - 0.5)

    return {
        "centroid": {"x": round(cx, 3), "y": round(cy, 3)},
        "region": _region(cx, cy),
        "offset_from_center": round(offset, 3),
        "bbox": bbox,
        "label": label,
        "confidence": confidence,
        "has_mask": has_mask,
        "source": source,
    }


def _bbox_dict(bbox: tuple[float, float, float, float] | None) -> dict | None:
    if bbox is None:
        return None
    x0, y0, x1, y1 = bbox
    return {
        "x0": round(float(x0), 3),
        "y0": round(float(y0), 3),
        "x1": round(float(x1), 3),
        "y1": round(float(y1), 3),
    }


def _region(x: float, y: float) -> str:
    col = "left" if x < 1 / 3 else "right" if x > 2 / 3 else "center"
    row = "top" if y < 1 / 3 else "bottom" if y > 2 / 3 else "middle"
    if row == "middle" and col == "center":
        return "center"
    return f"{row}-{col}"
