import logging
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def _warm_models() -> None:
    """Load heavyweight models in a background thread at startup.

    Running this off the main thread means the server accepts requests
    immediately; the first request that actually needs the model will
    block briefly until it's ready, but typically the model finishes
    loading well before any user submits a photo.
    """
    try:
        from app.services.composition.subject_localization import (
            YOLOWorldSubjectLocator,
        )

        logger.info("Warming YOLO-World model in background…")
        YOLOWorldSubjectLocator._get_model()
        logger.info("YOLO-World model ready.")
    except Exception:
        logger.warning("Model warm-up failed; will retry on first request.", exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    threading.Thread(target=_warm_models, daemon=True, name="model-warmup").start()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["meta"])
    def health() -> dict[str, str]:
        return {"status": "ok", "app": settings.app_name}

    from app.api.routes import analysis

    app.include_router(analysis.router, prefix="/api")

    return app


app = create_app()
