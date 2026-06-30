"""Analysis routes.

Thin HTTP layer: read the upload, hand bytes to the image service, return a
schema. As features land, this handler calls more services and the response
schema grows — the route logic stays simple.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.config import Settings, get_settings
from app.schemas.analysis import AnalysisResponse, ExifInfo, ImageInfo, VisionInfo
from app.services import image_io
from app.services.exif import exif_service
from app.services.vision import analysis_pipeline

router = APIRouter(tags=["analysis"])


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> AnalysisResponse:
    data = await file.read()

    try:
        image_io.validate_upload(
            data, file.content_type, max_bytes=settings.max_upload_bytes
        )
        image = image_io.open_image(data)
    except image_io.ImageValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    info = image_io.describe_image(
        image, filename=file.filename or "upload", size_bytes=len(data)
    )
    exif = exif_service.extract_exif(image)

    return AnalysisResponse(image=ImageInfo(**info), exif=ExifInfo(**exif))
