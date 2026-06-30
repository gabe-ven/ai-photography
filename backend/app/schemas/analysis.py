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


class AnalysisResponse(BaseModel):
    image: ImageInfo = Field(..., description="Basic metadata about the upload.")
    exif: ExifInfo = Field(..., description="Camera metadata extracted from EXIF.")
    vision: VisionInfo = Field(..., description="Objective CV image-quality metrics.")
