"""Leading lines via the probabilistic Hough line transform."""

from __future__ import annotations

import math
from collections import Counter

import cv2
import numpy as np

from app.services.composition._utils import canny_edges, to_gray_u8

_MAX_LINES = 20


def detect_leading_lines(image: np.ndarray) -> dict:
    gray = to_gray_u8(image)
    height, width = gray.shape
    edges = canny_edges(gray)

    min_length = max(10.0, 0.25 * min(height, width))
    raw = cv2.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi / 180,
        threshold=40,
        minLineLength=min_length,
        maxLineGap=10,
    )

    if raw is None:
        return {
            "has_leading_lines": False,
            "line_count": 0,
            "dominant_angle": None,
            "lines": [],
        }

    lines: list[dict] = []
    angles: list[int] = []
    for x1, y1, x2, y2 in raw[:, 0, :]:
        angle = math.degrees(math.atan2(int(y2) - int(y1), int(x2) - int(x1)))
        # Normalize to [0, 180) — direction doesn't matter for a line.
        angle = angle % 180
        lines.append(
            {
                "x1": int(x1),
                "y1": int(y1),
                "x2": int(x2),
                "y2": int(y2),
                "angle": round(angle, 1),
            }
        )
        angles.append(int(round(angle / 10.0) * 10) % 180)

    dominant_bin = Counter(angles).most_common(1)[0][0]
    return {
        "has_leading_lines": True,
        "line_count": len(lines),
        "dominant_angle": float(dominant_bin),
        "lines": lines[:_MAX_LINES],
    }
