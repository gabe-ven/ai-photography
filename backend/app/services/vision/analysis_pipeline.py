"""Vision analysis orchestrator.

Converts a PIL image to a single RGB array once, then runs each independent
metric over it and assembles one structured result. No AI, no composition
detection — just objective, reproducible measurements.
"""

from __future__ import annotations

import numpy as np
from PIL import Image

from app.services.vision.brightness import compute_brightness
from app.services.vision.colors import dominant_colors
from app.services.vision.contrast import compute_contrast
from app.services.vision.dynamic_range import compute_dynamic_range
from app.services.vision.histogram import compute_histogram
from app.services.vision.sharpness import compute_sharpness


def run_vision_analysis(image: Image.Image) -> dict:
    rgb = np.asarray(image.convert("RGB"))
    height, width = int(rgb.shape[0]), int(rgb.shape[1])

    return {
        "brightness": compute_brightness(rgb),
        "contrast": compute_contrast(rgb),
        "sharpness": compute_sharpness(rgb),
        "dominant_colors": dominant_colors(rgb),
        "histogram": compute_histogram(rgb),
        "dynamic_range": compute_dynamic_range(rgb),
        "dimensions": {
            "width": width,
            "height": height,
            "aspect_ratio": round(width / height, 2) if height else 0.0,
        },
        "orientation": _orientation(width, height),
    }


def _orientation(width: int, height: int) -> str:
    if width > height:
        return "landscape"
    if height > width:
        return "portrait"
    return "square"
