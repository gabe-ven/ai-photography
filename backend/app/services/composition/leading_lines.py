"""Leading lines via the probabilistic Hough line transform.

Raw HoughLinesP output over-counts on textured regions (foliage, bark):
one physical edge fragmented by leaf gaps comes back as many short,
near-duplicate segments. Four post-processing steps keep the metric honest:

1. Merging — segments close in angle AND perpendicular offset are fragments
   of the same edge and are merged into a single line spanning them all.
2. Spread gate — the merged lines must cover a meaningful portion of the
   frame. A dense cluster confined to one small region is texture, not a
   compositional leading line.
3. Vanishing-point coherence — real leading lines converge toward a common
   point; architectural patterns scatter their pairwise intersections
   uniformly. If lines are mostly parallel (e.g. a pier railing), the VP
   check is bypassed — those are still valid leading lines.
4. Length-weighted dominant angle — angle vote weighted by line length so a
   few long diagonals beat many short horizontal noise segments.
"""

from __future__ import annotations

import math
from collections import defaultdict

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
_MIN_SPREAD_FRACTION = 0.30

# Require at least this many distinct merged lines to qualify as leading lines.
# A single edge (however long) is structure, not a compositional element.
_MIN_LINE_COUNT = 2

# Vanishing-point coherence parameters.
# Only the longest _VP_MAX_LINES lines are used (keeps cost O(K²)).
_VP_MAX_LINES = 10
# Fraction of pairwise intersection points that must fall in the peak grid cell.
_VP_MIN_CLUSTER_FRACTION = 0.30
# Grid resolution over the 3×-width × 3×-height extended search region.
_VP_GRID_CELLS = 20
# If fewer than this many non-parallel line pairs exist, the lines are
# essentially parallel and the VP check is bypassed (still valid leading lines).
_VP_MIN_PAIRS_FOR_CHECK = 3

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
        threshold=25,
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

    if len(lines) < _MIN_LINE_COUNT or not _spread_ok(lines, width, height):
        return dict(_NOT_FOUND)

    if not _vp_coherent(lines, width, height):
        return dict(_NOT_FOUND)

    # Length-weighted angle vote: long lines carry more weight so a few
    # strong diagonals beat many short horizontal noise segments.
    #
    # When near-horizontal lines (within 20° of 0°) are a minority of the total
    # line length (< 40%), they are incidental structural background elements
    # (building floors, sky/ground boundaries) rather than the compositional
    # leading lines.  Exclude them from the angle vote so a diagonal or vertical
    # leading line is not masked by background horizontal edges.  When horizontal
    # lines ARE dominant (≥ 40%), they are the intended compositional direction
    # (pier receding to horizon, road surface) and must stay in the vote.
    total_len_all = sum(ln["length"] for ln in lines)
    horiz_len = sum(
        ln["length"] for ln in lines if _angle_diff(ln["angle"], 0.0) <= 20
    )
    vote_lines = lines
    if total_len_all > 0 and horiz_len / total_len_all < 0.40:
        non_horiz = [ln for ln in lines if _angle_diff(ln["angle"], 0.0) > 20]
        if non_horiz:
            vote_lines = non_horiz

    angle_weight: dict[int, float] = defaultdict(float)
    for ln in vote_lines:
        bin_ = int(round(ln["angle"] / 10.0) * 10) % 180
        angle_weight[bin_] += ln["length"]
    dominant_bin = max(angle_weight, key=angle_weight.__getitem__)

    return {
        "has_leading_lines": True,
        "line_count": len(lines),
        "dominant_angle": float(dominant_bin),
        "lines": lines[:_MAX_LINES],
    }


def _line_intersect(
    l1: dict, l2: dict
) -> tuple[float, float] | None:
    """Return the intersection point of two lines, or None if parallel."""
    x1, y1, x2, y2 = l1["x1"], l1["y1"], l1["x2"], l1["y2"]
    x3, y3, x4, y4 = l2["x1"], l2["y1"], l2["x2"], l2["y2"]
    denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
    if abs(denom) < 1e-6:
        return None
    t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
    return (x1 + t * (x2 - x1), y1 + t * (y2 - y1))


def _vp_coherent(lines: list[dict], width: int, height: int) -> bool:
    """True when the detected lines converge toward a common vanishing point.

    For each non-parallel pair of lines we compute their intersection. If the
    intersections cluster strongly near a single point (within a grid cell),
    the lines are genuinely converging — compositional leading lines.

    If too few non-parallel pairs exist (lines are essentially parallel, e.g.
    a pier railing), we bypass the check and return True: parallel lines
    spanning the frame are still valid leading lines.
    """
    # Use the top K longest lines to keep cost O(K²).
    candidates = sorted(lines, key=lambda l: l["length"], reverse=True)[
        :_VP_MAX_LINES
    ]

    # Search region: the image plus a 1× buffer on each side.
    gx_min, gx_max = -width, 2 * width
    gy_min, gy_max = -height, 2 * height
    cell_w = (gx_max - gx_min) / _VP_GRID_CELLS
    cell_h = (gy_max - gy_min) / _VP_GRID_CELLS

    grid: dict[tuple[int, int], int] = {}
    n_pairs = 0

    for i in range(len(candidates)):
        for j in range(i + 1, len(candidates)):
            # Skip pairs whose angles are too similar — their intersection is
            # at near-infinity and carries no VP information.
            if (
                _angle_diff(candidates[i]["angle"], candidates[j]["angle"])
                < _MERGE_ANGLE_DEG
            ):
                continue
            pt = _line_intersect(candidates[i], candidates[j])
            if pt is None:
                continue
            ix, iy = pt
            # Only count intersections inside the extended search region.
            if not (gx_min <= ix <= gx_max and gy_min <= iy <= gy_max):
                continue
            n_pairs += 1
            bx = min(int((ix - gx_min) / cell_w), _VP_GRID_CELLS - 1)
            by = min(int((iy - gy_min) / cell_h), _VP_GRID_CELLS - 1)
            grid[(bx, by)] = grid.get((bx, by), 0) + 1

    # Not enough non-parallel pairs → lines are roughly parallel; valid.
    if n_pairs < _VP_MIN_PAIRS_FOR_CHECK:
        return True

    # If one angle direction accounts for the dominant share of total line
    # length, the photo has a single compositional direction (pier railing,
    # road lines, railway tracks) — VP convergence doesn't apply.
    total_len = sum(l["length"] for l in candidates)
    if total_len > 0:
        angle_bin_lengths: dict[int, float] = defaultdict(float)
        for l in candidates:
            bin_ = int(round(l["angle"] / 20.0) * 20) % 180
            angle_bin_lengths[bin_] += l["length"]
        max_bin_len = max(angle_bin_lengths.values(), default=0.0)
        if max_bin_len >= 0.70 * total_len:
            return True

    top_bin = max(grid.values()) if grid else 0
    if top_bin >= _VP_MIN_CLUSTER_FRACTION * n_pairs:
        return True

    # Perspective-convergence parallel check: near-parallel lines with a
    # measurable angular spread indicate a pier / road receding to a very
    # distant vanishing point whose VP falls outside the search region.
    # Two conditions must both hold:
    #   1. A dominant angle group (within 30° of each other) accounts for
    #      ≥ 70% of total line length (lines are "mostly going the same way").
    #   2. The angular spread WITHIN that group is ≥ 20° (lines diverge enough
    #      to indicate real perspective, not a flat parallel pattern).
    # This correctly accepts a pier receding to the horizon (spread ~27°) and
    # correctly rejects a plain wall with a horizontal edge (spread ~16°).
    if total_len > 0:
        best_group_len = 0.0
        best_group: list[dict] = []
        for ref in candidates:
            group = [
                l for l in candidates
                if _angle_diff(l["angle"], ref["angle"]) <= 30.0
            ]
            group_len = sum(l["length"] for l in group)
            if group_len > best_group_len:
                best_group_len = group_len
                best_group = group
        if best_group_len >= 0.70 * total_len and len(best_group) >= 2:
            max_spread = max(
                _angle_diff(la["angle"], lb["angle"])
                for la in best_group
                for lb in best_group
            )
            if max_spread >= 20.0:
                return True

    return False


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
