"""Analysis routes.

Thin HTTP layer: read the upload, hand bytes to the image service, return a
schema. As features land, this handler calls more services and the response
schema grows — the route logic stays simple.
"""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.core.config import Settings, get_settings
from app.schemas.analysis import (
    AIAnalysis,
    AIAnalysisResponse,
    AnalysisResponse,
    ColorGradeResponse,
    CompositionInfo,
    ExifInfo,
    ImageInfo,
    VisionInfo,
)
from app.services import image_io
from app.services.ai import color_grading, photo_critique
from app.services.composition import composition_pipeline
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
    vision = analysis_pipeline.run_vision_analysis(image)
    composition = composition_pipeline.run_composition_analysis(image)

    return AnalysisResponse(
        image=ImageInfo(**info),
        exif=ExifInfo(**exif),
        vision=VisionInfo(**vision),
        composition=CompositionInfo(**composition),
    )


@router.post("/ai-analysis", response_model=AIAnalysisResponse)
async def ai_analysis(
    file: UploadFile = File(...),
    context: str | None = Form(
        default=None,
        description="Optional JSON string of the prior /analyze response, used "
        "to ground the AI in the already-computed CV/EXIF/vision measurements.",
    ),
    settings: Settings = Depends(get_settings),
) -> AIAnalysisResponse:
    """Generate an AI critique of the uploaded photo.

    Separate from /analyze so the fast CV metrics can render immediately while
    this slower vision-language call runs. Accepts the prior /analyze response
    as ``context`` so the model reasons from measured facts.
    """
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

    parsed_context: dict | None = None
    if context:
        try:
            loaded = json.loads(context)
            if isinstance(loaded, dict):
                parsed_context = loaded
        except json.JSONDecodeError:
            # A malformed context is non-fatal: fall back to image-only analysis.
            parsed_context = None

    critique = photo_critique.generate_critique(image, parsed_context)
    return AIAnalysisResponse(ai=AIAnalysis(**critique))


@router.post("/color-grade", response_model=ColorGradeResponse)
async def color_grade(
    file: UploadFile = File(...),
    context: str | None = Form(
        default=None,
        description="Optional JSON string of context — the prior /analyze "
        "response, optionally merged with the AI critique's scene summary — "
        "used to ground the suggested grade in measured facts.",
    ),
    settings: Settings = Depends(get_settings),
) -> ColorGradeResponse:
    """Suggest color grading adjustments for the uploaded photo.

    Same request contract as /ai-analysis: file + optional JSON context.
    """
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

    parsed_context: dict | None = None
    if context:
        try:
            loaded = json.loads(context)
            if isinstance(loaded, dict):
                parsed_context = loaded
        except json.JSONDecodeError:
            parsed_context = None

    result = color_grading.generate_color_grade(image, parsed_context)
    return ColorGradeResponse(**result)
