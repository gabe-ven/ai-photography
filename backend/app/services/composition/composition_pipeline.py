"""Composition analysis orchestrator.

Converts the image to a grayscale array once, then runs each independent
analyzer over it. No AI — purely geometric/structural measurements.
"""

from __future__ import annotations

import numpy as np
from PIL import Image

from app.services.composition.edge_density import compute_edge_density
from app.services.composition.horizon_detection import detect_horizon
from app.services.composition.leading_lines import detect_leading_lines
from app.services.composition.negative_space import estimate_negative_space
from app.services.composition.rule_of_thirds import analyze_rule_of_thirds
from app.services.composition.subject_position import estimate_subject_position
from app.services.composition.symmetry import analyze_symmetry


def run_composition_analysis(image: Image.Image) -> dict:
    gray = np.asarray(image.convert("L"))

    return {
        "rule_of_thirds": analyze_rule_of_thirds(gray),
        "leading_lines": detect_leading_lines(gray),
        "horizon": detect_horizon(gray),
        "symmetry": analyze_symmetry(gray),
        "subject_position": estimate_subject_position(gray),
        "edge_density": compute_edge_density(gray),
        "negative_space": estimate_negative_space(gray),
    }
