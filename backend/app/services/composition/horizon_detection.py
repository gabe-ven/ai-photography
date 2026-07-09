"""Horizon detection via vertical-gradient row projection.

A horizon is a strong, sustained horizontal edge that divides a calmer
sky-like region above from a textured ground/water region below.

Algorithm:
1. Build a row-energy profile from the vertical Sobel gradient.
2. Collect all candidate rows whose energy exceeds a minimum threshold.
3. For each candidate (highest energy first), verify three properties:

   Sky-calm check: the local window of rows directly above the candidate
   must be calmer than the candidate row itself (relative threshold) AND
   calmer than the frame average (absolute threshold).

   Ground-noisier check: the window of rows directly BELOW the candidate
   must be at least as textured as the window above.  Real water/ground is
   always noisier than sky; a structural edge above a dark silhouette
   building or a plain studio background fails this gate.

   Width-coverage check: the edge must be present across all three
   horizontal thirds of the frame.

4. If the strict pass finds no result, retry with relaxed thresholds but
   require a stronger ground-vs-sky noisiness contrast.

This multi-candidate, multi-pass approach handles:
- Photos where the waterline is weaker than a nearby structural edge
- Urban waterfronts where the "sky" above is slightly noisy (city haze)
- Silhouette buildings whose top edge would otherwise look like a horizon
"""

from __future__ import annotations

import math

import cv2
import numpy as np

from app.services.composition._utils import to_gray_u8

# --- Pass-1 (strict) parameters ---
_THRESH_STRICT = 2.5           # ×mean row energy
_SKY_ABS_STRICT = 0.80         # sky_window_pp < X × global_mean_pp
_SKY_REL_STRICT = 0.85         # sky_window_pp < X × candidate_pp
_GROUND_MIN_RATIO_STRICT = 0.90  # ground_window_pp > X × sky_window_pp

# --- Pass-2 (relaxed) parameters ---
# Lowered energy threshold to find subtle waterlines; compensated by
# requiring significantly noisier ground below than sky above.
_THRESH_RELAXED = 1.60
_SKY_ABS_RELAXED = 1.40        # sky may be moderately noisy (urban haze)
_SKY_REL_RELAXED = 0.80
_GROUND_MIN_RATIO_RELAXED = 1.20  # ground must be 20% noisier than sky above
# Tighter vertical position range for the relaxed pass to avoid picking up
# overhead architectural edges (< 20% height) or ground-level edges (> 84%).
_Y_MIN_RELAXED = 0.20
_Y_MAX_RELAXED = 0.84

# Fraction of frame height to sample for sky/ground windows.
_WIN_FRAC = 0.08
# Y margins — horizons rarely sit at the very top or bottom.
_Y_MARGIN_FRAC = 0.08
_LEVEL_TOLERANCE_DEG = 3.0


def _check_candidate(
    peak: int,
    sobel_y: np.ndarray,
    row_energy: np.ndarray,
    height: int,
    width: int,
    global_mean_pp: float,
    sky_abs: float,
    sky_rel: float,
    ground_min_ratio: float,
) -> bool:
    """Return True if *peak* passes sky-calm, ground-noisier, and thirds checks."""
    sky_win = max(5, int(_WIN_FRAC * height))

    # --- sky-calm check ---
    window_start = max(0, peak - sky_win)
    if peak - window_start < 3:
        return False
    sky_win_pp = float(sobel_y[window_start:peak, :].mean())
    cand_pp = row_energy[peak] / width
    if cand_pp <= 0:
        return False
    if sky_win_pp > sky_abs * global_mean_pp:
        return False  # sky too noisy relative to the frame average
    if sky_win_pp > sky_rel * cand_pp:
        return False  # sky too noisy relative to the edge itself

    # --- ground-noisier check ---
    ground_end = min(height, peak + 1 + sky_win)
    if ground_end > peak + 1:
        ground_win_pp = float(sobel_y[peak + 1 : ground_end, :].mean())
        if ground_win_pp < ground_min_ratio * sky_win_pp:
            return False  # ground below is not noisier than sky above

    # --- width-coverage check ---
    third = max(1, width // 3)
    return (
        float(sobel_y[peak, :third].mean()) > global_mean_pp
        and float(sobel_y[peak, third : 2 * third].mean()) > global_mean_pp
        and float(sobel_y[peak, 2 * third :].mean()) > global_mean_pp
    )


def detect_horizon(image: np.ndarray) -> dict:
    gray = to_gray_u8(image).astype(np.float64)
    height, width = gray.shape

    not_found = {
        "horizon_detected": False,
        "horizon_y": None,
        "is_level": False,
        "tilt_angle": None,
    }
    if height < 10 or width < 10:
        return not_found

    sobel_y = np.abs(cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3))
    row_energy = sobel_y.sum(axis=1)
    mean_energy = float(row_energy.mean())
    if mean_energy <= 0:
        return not_found

    global_mean_pp = mean_energy / width

    def _find(
        thresh_factor: float,
        sky_abs: float,
        sky_rel: float,
        ground_ratio: float,
        y_min: float = _Y_MARGIN_FRAC,
        y_max: float = 1.0 - _Y_MARGIN_FRAC,
    ):
        r_min = int(y_min * height)
        r_max = int(y_max * height)
        threshold = thresh_factor * mean_energy
        cands = sorted(
            [r for r in range(r_min, r_max + 1) if row_energy[r] >= threshold],
            key=lambda r: row_energy[r],
            reverse=True,
        )
        for peak in cands:
            if _check_candidate(
                peak, sobel_y, row_energy, height, width, global_mean_pp,
                sky_abs, sky_rel, ground_ratio,
            ):
                return peak
        return None

    # Pass 1: strict — avoids false positives on photos with no real horizon.
    peak = _find(_THRESH_STRICT, _SKY_ABS_STRICT, _SKY_REL_STRICT, _GROUND_MIN_RATIO_STRICT)

    # Pass 2: relaxed — picks up subtle waterlines in complex outdoor scenes
    # where the mean row energy is high and the waterline is relatively weak.
    # Tighter vertical position range avoids architectural/ground false positives.
    if peak is None:
        peak = _find(
            _THRESH_RELAXED, _SKY_ABS_RELAXED, _SKY_REL_RELAXED, _GROUND_MIN_RATIO_RELAXED,
            y_min=_Y_MIN_RELAXED, y_max=_Y_MAX_RELAXED,
        )

    if peak is None:
        return not_found

    half = width // 2
    left_peak = int(np.argmax(sobel_y[:, :half].sum(axis=1)))
    right_peak = int(np.argmax(sobel_y[:, half:].sum(axis=1)))
    tilt = math.degrees(math.atan2(right_peak - left_peak, max(half, 1)))

    return {
        "horizon_detected": True,
        "horizon_y": round(peak / max(height - 1, 1), 3),
        "is_level": bool(abs(tilt) <= _LEVEL_TOLERANCE_DEG),
        "tilt_angle": round(tilt, 2),
    }
