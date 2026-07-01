"""The located subject of a photo.

`Subject` is the structured replacement for the bare gradient-energy centroid.
It carries everything the composition analyzers need to reason about *where
the subject is*: a normalized bounding box, an optional pixel mask, a centroid,
and provenance (detector vs. saliency fallback) so consumers can decide how
much to trust it.

All spatial coordinates are normalized to ``[0, 1]`` with origin at the
top-left, matching the rest of the composition pipeline.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np

SubjectSource = Literal["detector", "vlm", "saliency"]


@dataclass(frozen=True)
class Subject:
    """Where the subject sits in the frame.

    Attributes:
        centroid: Normalized ``(x, y)`` center of the subject. Always present.
        bbox: Normalized ``(x0, y0, x1, y1)`` box, or ``None`` when we only
            have a centroid (the saliency fallback has no reliable footprint).
        mask: Boolean ``(H, W)`` array marking subject pixels, or ``None`` when
            no segmentation was produced.
        confidence: Detector confidence in ``[0, 1]``. ``0.0`` for fallbacks.
        label: Open-vocabulary class label, or ``None`` for the fallback.
        source: ``"detector"``, ``"vlm"``, or ``"saliency"``.
    """

    centroid: tuple[float, float]
    bbox: tuple[float, float, float, float] | None = None
    mask: np.ndarray | None = None
    confidence: float = 0.0
    label: str | None = None
    source: SubjectSource = "saliency"

    @property
    def has_mask(self) -> bool:
        return self.mask is not None

    @classmethod
    def from_saliency(cls, centroid: tuple[float, float]) -> "Subject":
        """Build a centroid-only subject from the legacy saliency fallback."""
        return cls(centroid=centroid, source="saliency")

    @classmethod
    def from_detection(
        cls,
        bbox: tuple[float, float, float, float],
        *,
        confidence: float,
        label: str | None,
        mask: np.ndarray | None = None,
        source: Literal["detector", "vlm"] = "detector",
    ) -> "Subject":
        """Build a detector- or VLM-sourced subject, deriving the centroid
        from the best available footprint: the mask center-of-mass if a mask
        is present, otherwise the bbox center.
        """
        centroid = _mask_centroid(mask) if mask is not None else _bbox_center(bbox)
        return cls(
            centroid=centroid,
            bbox=bbox,
            mask=mask,
            confidence=float(confidence),
            label=label,
            source=source,
        )


def _bbox_center(bbox: tuple[float, float, float, float]) -> tuple[float, float]:
    x0, y0, x1, y1 = bbox
    return (x0 + x1) / 2.0, (y0 + y1) / 2.0


def _mask_centroid(mask: np.ndarray) -> tuple[float, float]:
    """Normalized center-of-mass of a boolean mask.

    Falls back to the geometric center when the mask is empty.
    """
    height, width = mask.shape
    ys, xs = np.nonzero(mask)
    if xs.size == 0:
        return 0.5, 0.5
    cx = float(xs.mean()) / max(width - 1, 1)
    cy = float(ys.mean()) / max(height - 1, 1)
    return cx, cy
