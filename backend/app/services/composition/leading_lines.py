"""Leading lines via the Line Segment Detector (LSD).

LSD (cv2.createLineSegmentDetector) yields cleaner, longer, less noisy
segments than the probabilistic Hough transform, which fragments a single
physical edge into many short near-duplicates across textured regions. If LSD
is unavailable in the installed OpenCV build (it has been patent-gated in some
releases) or construction fails, we silently fall back to HoughLinesP.

A detected segment counts as a leading line only if it survives three filters:

1. Length — at least 20% of the frame diagonal (kills texture noise).
2. Angle  — more than 15 degrees from horizontal (near-horizontal edges are
   horizon candidates, handled by horizon_detection; not leading lines).
3. Edge   — it enters the frame from a border: an endpoint sits within 10% of
   a frame edge, or the segment's infinite extension crosses a frame edge.

Among the survivors we measure convergence toward the subject: a line "leads to
the subject" when its infinite extension passes within 15% of the frame
diagonal of the subject centroid (subject.centroid when available, else the
frame center (0.5, 0.5)). The photo has leading lines when at least one
survivor converges; the convergence fraction (passing / surviving) is the
internal strength signal that drives has_leading_lines.
"""

from __future__ import annotations

import math
from collections import defaultdict

import cv2
import numpy as np

from app.services.composition._utils import canny_edges_structural, to_gray_u8
from app.services.composition.subject import Subject

# Cap on how many segments we hand back to the overlay renderer.
_MAX_LINES = 20

# --- Filter thresholds -----------------------------------------------------
# Minimum segment length as a fraction of the frame diagonal.
_MIN_LENGTH_FRACTION = 0.20
# Minimum angle from horizontal (degrees). At/below this a line is a horizon
# candidate, not a leading line.
_MIN_ANGLE_FROM_HORIZONTAL = 15.0
# An endpoint within this fraction of any edge (per axis) counts as touching it.
_EDGE_MARGIN_FRACTION = 0.10
# A line's extension within this fraction of the frame diagonal of the subject
# centroid counts as "leading to the subject".
_CONVERGENCE_FRACTION = 0.15

_NOT_FOUND = {
    "has_leading_lines": False,
    "line_count": 0,
    "dominant_angle": None,
    "lines": [],
}


def detect_leading_lines(image: np.ndarray, subject: Subject | None = None) -> dict:
    gray = to_gray_u8(image)
    height, width = gray.shape
    frame_diagonal = math.hypot(width, height)
    if frame_diagonal == 0:
        return dict(_NOT_FOUND)

    # 1. Detect segments — LSD first, Hough as a silent fallback.
    raw = _detect_lsd(gray)
    if raw is None:
        raw = _detect_hough(gray, height, width)
    if not raw:
        return dict(_NOT_FOUND)

    segments = [_segment(x1, y1, x2, y2) for (x1, y1, x2, y2) in raw]

    # 2. Geometry filters: length, angle-from-horizontal, edge entry.
    survivors = [
        s for s in segments if _passes_filters(s, width, height, frame_diagonal)
    ]
    if not survivors:
        return dict(_NOT_FOUND)
    survivors.sort(key=lambda s: s["length"], reverse=True)

    # 3. Convergence toward the subject centroid (normalized -> pixels).
    cx, cy = subject.centroid if subject is not None else (0.5, 0.5)
    centroid_x, centroid_y = cx * width, cy * height
    converge_threshold = _CONVERGENCE_FRACTION * frame_diagonal
    passing = sum(
        1
        for s in survivors
        if _point_to_line_distance(
            centroid_x, centroid_y, s["x1"], s["y1"], s["x2"], s["y2"]
        )
        <= converge_threshold
    )

    # A photo "has leading lines" only when at least one surviving line actually
    # leads toward the subject. Lines that clear the geometry filters but ignore
    # the subject are structure, not composition. (convergence = passing/total.)
    if passing == 0:
        return dict(_NOT_FOUND)

    return {
        "has_leading_lines": True,
        "line_count": len(survivors),
        "dominant_angle": _dominant_angle(survivors),
        "lines": survivors[:_MAX_LINES],
    }


# ---------------------------------------------------------------------------
# Detection backends
# ---------------------------------------------------------------------------


def _detect_lsd(gray: np.ndarray) -> list[tuple[float, float, float, float]] | None:
    """Detect line segments with LSD. Returns None if LSD is unavailable."""
    try:
        lsd = cv2.createLineSegmentDetector()
        detected = lsd.detect(gray)
    except Exception:  # noqa: BLE001 - any LSD failure -> fall back to Hough
        return None

    # detect() returns (lines, width, prec, nfa); lines is (N, 1, 4) or None.
    lines = detected[0] if isinstance(detected, tuple) else detected
    if lines is None or len(lines) == 0:
        return None
    return [tuple(float(v) for v in ln[0]) for ln in lines]


def _detect_hough(
    gray: np.ndarray, height: int, width: int
) -> list[tuple[float, float, float, float]] | None:
    """Silent fallback: probabilistic Hough transform over structural edges."""
    edges = canny_edges_structural(gray)
    min_length = max(10.0, 0.15 * min(height, width))
    raw = cv2.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi / 180,
        threshold=25,
        minLineLength=min_length,
        maxLineGap=20,
    )
    if raw is None:
        return None
    return [tuple(float(v) for v in seg) for seg in raw[:, 0, :]]


# ---------------------------------------------------------------------------
# Segment construction + filters
# ---------------------------------------------------------------------------


def _segment(x1: float, y1: float, x2: float, y2: float) -> dict:
    ix1, iy1, ix2, iy2 = (int(round(v)) for v in (x1, y1, x2, y2))
    angle = math.degrees(math.atan2(iy2 - iy1, ix2 - ix1)) % 180
    length = math.hypot(ix2 - ix1, iy2 - iy1)
    return {
        "x1": ix1,
        "y1": iy1,
        "x2": ix2,
        "y2": iy2,
        "angle": round(angle, 1),
        "length": round(length, 1),
    }


def _passes_filters(
    seg: dict, width: int, height: int, frame_diagonal: float
) -> bool:
    if seg["length"] < _MIN_LENGTH_FRACTION * frame_diagonal:
        return False
    if _angle_from_horizontal(seg["angle"]) <= _MIN_ANGLE_FROM_HORIZONTAL:
        return False
    return _enters_from_edge(seg, width, height)


def _angle_from_horizontal(angle: float) -> float:
    """Angle to the nearest horizontal, in [0, 90] degrees."""
    a = angle % 180
    return min(a, 180 - a)


def _enters_from_edge(seg: dict, width: int, height: int) -> bool:
    """True if an endpoint is within the edge margin, or the infinite line
    extension crosses the frame border."""
    margin_x = _EDGE_MARGIN_FRACTION * width
    margin_y = _EDGE_MARGIN_FRACTION * height
    for px, py in ((seg["x1"], seg["y1"]), (seg["x2"], seg["y2"])):
        if (
            px <= margin_x
            or px >= width - margin_x
            or py <= margin_y
            or py >= height - margin_y
        ):
            return True
    return _line_crosses_frame_border(seg, width, height)


def _line_crosses_frame_border(seg: dict, width: int, height: int) -> bool:
    """True if the infinite line through the segment intersects the frame
    rectangle boundary [0, width] x [0, height]."""
    x1, y1, x2, y2 = seg["x1"], seg["y1"], seg["x2"], seg["y2"]
    dx, dy = x2 - x1, y2 - y1
    eps = 1e-9
    if dx != 0:
        for xb in (0.0, float(width)):
            t = (xb - x1) / dx
            y = y1 + t * dy
            if -eps <= y <= height + eps:
                return True
    if dy != 0:
        for yb in (0.0, float(height)):
            t = (yb - y1) / dy
            x = x1 + t * dx
            if -eps <= x <= width + eps:
                return True
    return False


def _point_to_line_distance(
    px: float, py: float, x1: float, y1: float, x2: float, y2: float
) -> float:
    """Perpendicular distance from a point to the infinite line through two points."""
    dx = x2 - x1
    dy = y2 - y1
    norm = math.hypot(dx, dy)
    if norm == 0:
        return math.hypot(px - x1, py - y1)
    return abs(dy * (px - x1) - dx * (py - y1)) / norm


def _dominant_angle(lines: list[dict]) -> float:
    """Length-weighted dominant angle, binned to 10 degrees (in [0, 180))."""
    weight: dict[int, float] = defaultdict(float)
    for ln in lines:
        bin_ = int(round(ln["angle"] / 10.0) * 10) % 180
        weight[bin_] += ln["length"]
    return float(max(weight, key=weight.__getitem__))
