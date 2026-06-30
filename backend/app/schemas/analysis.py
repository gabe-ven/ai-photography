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


class AnalysisResponse(BaseModel):
    image: ImageInfo = Field(..., description="Basic metadata about the upload.")
    # exif: ExifInfo | None = None        # added in the EXIF feature
    # composition: CompositionInfo | None  # added in the CV feature
    # ...
