"""API contract for the analysis endpoint.

`AnalysisResponse` is intentionally small right now. Each feature we add
(EXIF, composition, lighting, AI critique...) appends a new optional field
here, so the contract grows without breaking existing clients.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ImageInfo(BaseModel):
    filename: str
    format: str
    mode: str
    width: int
    height: int
    megapixels: float
    aspect_ratio: float
    size_bytes: int


class GpsCoordinates(BaseModel):
    latitude: float
    longitude: float


class ExifInfo(BaseModel):
    """Camera metadata read from the file. Every field is optional because
    many images (screenshots, exports, stripped photos) carry no EXIF."""

    has_exif: bool = Field(..., description="True if any EXIF field was found.")
    make: str | None = None
    model: str | None = None
    lens: str | None = None
    iso: int | None = None
    aperture: str | None = None
    shutter_speed: str | None = None
    focal_length: str | None = None
    date_taken: str | None = None
    gps: GpsCoordinates | None = None


class ColorSwatch(BaseModel):
    hex: str
    rgb: list[int]
    proportion: float


class Dimensions(BaseModel):
    width: int
    height: int
    aspect_ratio: float


class Histogram(BaseModel):
    bins: int
    r: list[int]
    g: list[int]
    b: list[int]


class DynamicRange(BaseModel):
    low: float
    high: float
    range: float
    stops: float


class VisionInfo(BaseModel):
    """Objective image-quality metrics from the OpenCV pipeline (no AI)."""

    brightness: float
    contrast: float
    sharpness: float
    dominant_colors: list[ColorSwatch]
    histogram: Histogram
    dynamic_range: DynamicRange
    dimensions: Dimensions
    orientation: str


class Point(BaseModel):
    x: float
    y: float


class RuleOfThirds(BaseModel):
    score: float
    follows_rule: bool
    centroid: Point
    nearest_power_point: Point
    distance_to_power_point: float


class LineSegment(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int
    angle: float


class LeadingLines(BaseModel):
    has_leading_lines: bool
    line_count: int
    dominant_angle: float | None
    lines: list[LineSegment]


class Horizon(BaseModel):
    horizon_detected: bool
    horizon_y: float | None
    is_level: bool
    tilt_angle: float | None


class Symmetry(BaseModel):
    vertical: float
    horizontal: float
    is_symmetric: bool
    dominant_axis: str


class SubjectPosition(BaseModel):
    centroid: Point
    region: str
    offset_from_center: float


class EdgeDensity(BaseModel):
    edge_density: float
    busyness: str


class NegativeSpace(BaseModel):
    negative_space_ratio: float
    has_significant_negative_space: bool


class CompositionInfo(BaseModel):
    """Geometric/structural composition metrics from OpenCV (no AI)."""

    rule_of_thirds: RuleOfThirds
    leading_lines: LeadingLines
    horizon: Horizon
    symmetry: Symmetry
    subject_position: SubjectPosition
    edge_density: EdgeDensity
    negative_space: NegativeSpace


class AnalysisResponse(BaseModel):
    image: ImageInfo = Field(..., description="Basic metadata about the upload.")
    exif: ExifInfo = Field(..., description="Camera metadata extracted from EXIF.")
    vision: VisionInfo = Field(..., description="Objective CV image-quality metrics.")
    composition: CompositionInfo = Field(
        ..., description="Geometric composition metrics."
    )
