import cv2
import numpy as np
from PIL import Image

from app.services.composition.composition_pipeline import run_composition_analysis
from app.services.composition.edge_density import compute_edge_density
from app.services.composition.horizon_detection import detect_horizon
from app.services.composition.leading_lines import detect_leading_lines
from app.services.composition.negative_space import estimate_negative_space
from app.services.composition.rule_of_thirds import analyze_rule_of_thirds
from app.services.composition.subject_position import estimate_subject_position
from app.services.composition.symmetry import analyze_symmetry


def _blank(size: int = 100) -> np.ndarray:
    return np.zeros((size, size), dtype=np.uint8)


def _with_square(top: int, left: int, side: int = 26, size: int = 100) -> np.ndarray:
    img = _blank(size)
    img[top : top + side, left : left + side] = 255
    return img


def _checkerboard(size: int = 100, cell: int = 5) -> np.ndarray:
    ys, xs = np.indices((size, size))
    return (((xs // cell + ys // cell) % 2) * 255).astype(np.uint8)


# --- rule of thirds -------------------------------------------------------


def test_rule_of_thirds_subject_on_power_point() -> None:
    img = _with_square(top=20, left=20)  # centered near (0.33, 0.33)
    result = analyze_rule_of_thirds(img)
    assert result["follows_rule"] is True
    assert result["score"] > 0.6


def test_rule_of_thirds_centered_subject_fails() -> None:
    img = _with_square(top=37, left=37)  # dead center
    result = analyze_rule_of_thirds(img)
    assert result["follows_rule"] is False
    assert result["score"] < 0.3


# --- leading lines --------------------------------------------------------


def test_leading_lines_blank_has_none() -> None:
    result = detect_leading_lines(_blank())
    assert result["has_leading_lines"] is False
    assert result["line_count"] == 0


def test_leading_lines_detects_diagonal() -> None:
    img = _blank()
    cv2.line(img, (10, 10), (90, 90), 255, 2)
    result = detect_leading_lines(img)
    assert result["has_leading_lines"] is True
    assert result["line_count"] >= 1
    assert abs(result["dominant_angle"] - 45) <= 15


# --- horizon --------------------------------------------------------------


def test_horizon_detects_horizontal_edge() -> None:
    img = _blank()
    img[50:, :] = 255  # hard horizontal edge at the middle
    result = detect_horizon(img)
    assert result["horizon_detected"] is True
    assert abs(result["horizon_y"] - 0.5) < 0.1
    assert result["is_level"] is True


def test_horizon_blank_not_detected() -> None:
    assert detect_horizon(_blank())["horizon_detected"] is False


# --- symmetry -------------------------------------------------------------


def test_symmetry_mirrored_is_high() -> None:
    rng = np.random.default_rng(0)
    half = rng.integers(0, 256, (50, 50), dtype=np.uint8)
    img = np.hstack([half, np.fliplr(half)])
    result = analyze_symmetry(img)
    assert result["vertical"] > 0.95
    assert result["dominant_axis"] == "vertical"


def test_symmetry_asymmetric_is_low() -> None:
    img = np.zeros((50, 100), dtype=np.uint8)
    img[:, 50:] = 255
    result = analyze_symmetry(img)
    assert result["vertical"] < 0.1


def test_symmetry_solid_is_symmetric() -> None:
    img = np.full((50, 50), 128, dtype=np.uint8)
    result = analyze_symmetry(img)
    assert result["is_symmetric"] is True


# --- subject position -----------------------------------------------------


def test_subject_position_top_left() -> None:
    img = _with_square(top=15, left=15)
    assert estimate_subject_position(img)["region"] == "top-left"


def test_subject_position_center() -> None:
    img = _with_square(top=37, left=37)
    result = estimate_subject_position(img)
    assert result["region"] == "center"
    assert result["offset_from_center"] < 0.1


# --- edge density ---------------------------------------------------------


def test_edge_density_blank_is_minimal() -> None:
    result = compute_edge_density(_blank())
    assert result["edge_density"] == 0.0
    assert result["busyness"] == "minimal"


def test_edge_density_checkerboard_is_busy() -> None:
    result = compute_edge_density(_checkerboard())
    assert result["edge_density"] > 0.1


def test_edge_density_regions_keys_and_range() -> None:
    result = compute_edge_density(_checkerboard())
    regions = result["regions"]
    assert set(regions) == {"top", "bottom", "left", "right", "center"}
    for value in regions.values():
        assert 0.0 <= value <= 1.0


def test_edge_density_regions_top_heavy() -> None:
    # All edges concentrated in the top half -> top region denser than bottom.
    img = _blank(size=100)
    img[:50, :] = _checkerboard(size=100, cell=5)[:50, :]
    regions = compute_edge_density(img)["regions"]
    assert regions["top"] > regions["bottom"]


def test_edge_density_regions_tiny_image_no_crash() -> None:
    tiny = np.array([[10, 200], [50, 90]], dtype=np.uint8)
    regions = compute_edge_density(tiny)["regions"]
    assert set(regions) == {"top", "bottom", "left", "right", "center"}
    for value in regions.values():
        assert 0.0 <= value <= 1.0


# --- negative space -------------------------------------------------------


def test_negative_space_blank_is_full() -> None:
    result = estimate_negative_space(_blank())
    assert result["negative_space_ratio"] > 0.95
    assert result["has_significant_negative_space"] is True


def test_negative_space_busy_is_low() -> None:
    result = estimate_negative_space(_checkerboard())
    assert result["negative_space_ratio"] < 0.5


# --- small images & pipeline ---------------------------------------------


def test_modules_handle_tiny_image() -> None:
    tiny = np.array([[10, 200], [50, 90]], dtype=np.uint8)
    assert detect_horizon(tiny)["horizon_detected"] is False
    assert detect_leading_lines(tiny)["line_count"] == 0
    assert 0.0 <= analyze_symmetry(tiny)["vertical"] <= 1.0


def test_pipeline_structure() -> None:
    image = Image.fromarray(_with_square(top=20, left=20)).convert("RGB")
    result = run_composition_analysis(image)
    assert set(result) == {
        "rule_of_thirds",
        "leading_lines",
        "horizon",
        "symmetry",
        "subject_position",
        "edge_density",
        "negative_space",
    }
