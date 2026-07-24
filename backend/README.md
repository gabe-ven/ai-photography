# Frame Grader — Backend

FastAPI service that runs the computer-vision pipeline, extracts EXIF, and
orchestrates the AI (vision-language model + LLM) to produce the photo analysis.

## Setup

Requires Python 3.11–3.13 (3.14 has no prebuilt wheels for some deps yet).

```bash
python3.13 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Then open http://localhost:8000/docs for the interactive API docs.

## Layout

```
app/
├── main.py            # FastAPI app factory + startup wiring
├── core/              # cross-cutting config & settings
├── api/               # HTTP layer: routers and route handlers (thin)
├── services/          # business logic, framework-agnostic
│   ├── exif/          # EXIF metadata extraction
│   ├── vision/        # OpenCV/Pillow analysis (composition, lighting)
│   └── ai/            # VLM + LLM orchestration
├── schemas/           # Pydantic request/response models (the API contract)
└── utils/             # small shared helpers
tests/                 # pytest suite mirroring app/
```

The guiding principle: `api/` stays thin (parse request → call a service →
return a schema). All real work lives in `services/`, which keeps logic testable
and independent of FastAPI.
