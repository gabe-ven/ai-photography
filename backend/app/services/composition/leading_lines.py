"""Leading lines via the probabilistic Hough line transform.

Raw HoughLinesP output over-counts on textured regions (foliage, bark):
one physical edge fragmented by leaf gaps comes back as many short,
near-duplicate segments. Two post-processing steps keep the metric honest:

1. Merging — segments close in angle AND perpendicular offset are fragments
   of the same edge and are merged into a single line spanning them all.
2. Spread gate — the merged lines must cover a meaningful portion of the
   frame. A dense cluster confined to one small region is texture, not a
   compositional leading line.
"""

from __future__ import annotations

import math
from collections import Counter

import cv2
import numpy as np

from app.services.composition._utils import canny_edges_structural, to_gray_u8

_MAX_LINES = 20

# Segments whose angle differs by no more than this AND whose perpendicular
# offset from a cluster's representative line is no more than this are
# considered fragments of the same physical edge.
_MERGE_ANGLE_DEG = 10.0
_MERGE_OFFSET_PX = 15.0

# Merged lines must span at least this fraction of the frame diagonal
# (bounding box of all endpoints) to count as leading lines at all.
_MIN_SPREAD_FRACTION = 0.20

_NOT_FOUND = {
    "has_leading_lines": False,
    "line_count": 0,
    "dominant_angle": None,
    "lines": [],
}


def detect_leading_lines(image: np.ndarray) -> dict:
    gray = to_gray_u8(image)
    height, width = gray.shape
    edges = canny_edges_structural(gray)

    min_length = max(10.0, 0.15 * min(height, width))
    raw = cv2.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi / 180,
        threshold=30,
        minLineLength=min_length,
        maxLineGap=20,
    )

    if raw is None:
        return dict(_NOT_FOUND)

    segments: list[dict] = []
    for x1, y1, x2, y2 in raw[:, 0, :]:
        angle = math.degrees(math.atan2(int(y2) - int(y1), int(x2) - int(x1)))
        # Normalize to [0, 180) — direction doesn't matter for a line.
        angle = angle % 180
        length = math.hypot(int(x2) - int(x1), int(y2) - int(y1))
        segments.append(
            {
                "x1": int(x1),
                "y1": int(y1),
                "x2": int(x2),
                "y2": int(y2),
                "angle": round(angle, 1),
                "length": round(length, 1),
            }
        )

    # Longest first so the longest fragment of each edge becomes the cluster
    # representative, and so the final list is sorted by significance.
    segments.sort(key=lambda ln: ln["length"], reverse=True)

    lines = _merge_segments(segments)

    if not _spread_ok(lines, width, height):
        return dict(_NOT_FOUND)

    angles = [int(round(ln["angle"] / 10.0) * 10) % 180 for ln in lines]
    dominant_bin = Counter(angles).most_common(1)[0][0]

    return {
        "has_leading_lines": True,
        "line_count": len(lines),
        "dominant_angle": float(dominant_bin),
        "lines": lines[:_MAX_LINES],
    }


def _angle_diff(a: float, b: float) -> float:
    """Smallest difference between two line angles in [0, 180) degrees."""
    d = abs(a - b) % 180
    return min(d, 180 - d)


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


def _merge_segments(segments: list[dict]) -> list[dict]:
    """Greedily cluster near-duplicate segments and merge each cluster.

    Input must be sorted longest-first: the longest segment of each cluster
    acts as the representative that later fragments are compared against.
    The merged line spans the extreme projections of every clustered
    endpoint onto the representative's axis, so fragments extend the line
    rather than being simply discarded.
    """
    clusters: list[list[dict]] = []
    for seg in segments:
        mx = (seg["x1"] + seg["x2"]) / 2
        my = (seg["y1"] + seg["y2"]) / 2
        placed = False
        for cluster in clusters:
            rep = cluster[0]
            if (
                _angle_diff(seg["angle"], rep["angle"]) <= _MERGE_ANGLE_DEG
                and _point_to_line_distance(
                    mx, my, rep["x1"], rep["y1"], rep["x2"], rep["y2"]
                )
                <= _MERGE_OFFSET_PX
            ):
                cluster.append(seg)
                placed = True
                break
        if not placed:
            clusters.append([seg])

    merged: list[dict] = []
    for cluster in clusters:
        rep = cluster[0]
        dx = rep["x2"] - rep["x1"]
        dy = rep["y2"] - rep["y1"]
        norm = math.hypot(dx, dy) or 1.0
        ux, uy = dx / norm, dy / norm

        # Project every endpoint in the cluster onto the representative's
        # axis; the merged line spans the extremes.
        ts: list[float] = []
        for seg in cluster:
            for px, py in ((seg["x1"], seg["y1"]), (seg["x2"], seg["y2"])):
                ts.append((px - rep["x1"]) * ux + (py - rep["y1"]) * uy)
        t_min, t_max = min(ts), max(ts)

        x1 = rep["x1"] + t_min * ux
        y1 = rep["y1"] + t_min * uy
        x2 = rep["x1"] + t_max * ux
        y2 = rep["y1"] + t_max * uy
        angle = math.degrees(math.atan2(y2 - y1, x2 - x1)) % 180
        merged.append(
            {
                "x1": int(round(x1)),
                "y1": int(round(y1)),
                "x2": int(round(x2)),
                "y2": int(round(y2)),
                "angle": round(angle, 1),
                "length": round(t_max - t_min, 1),
            }
        )

    merged.sort(key=lambda ln: ln["length"], reverse=True)
    return merged


def _spread_ok(lines: list[dict], width: int, height: int) -> bool:
    """True when the lines span a meaningful portion of the frame.

    Rejects the foliage/bark case: many segments confined to one small
    region are texture, not compositional leading lines.
    """
    if not lines:
        return False
    xs: list[int] = []
    ys: list[int] = []
    for ln in lines:
        xs.extend((ln["x1"], ln["x2"]))
        ys.extend((ln["y1"], ln["y2"]))
    spread = math.hypot(max(xs) - min(xs), max(ys) - min(ys))
    frame_diagonal = math.hypot(width, height)
    return spread >= _MIN_SPREAD_FRACTION * frame_diagonal
