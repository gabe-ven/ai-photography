# Photographer Brain

AI-powered photo critique. Upload a photograph and get a structured analysis covering
composition, lighting, estimated camera settings, improvement suggestions, how to
recreate the shot, recommended Fujifilm film recipes, and Lightroom editing tips.

## Stack

| Layer            | Tech                                  |
| ---------------- | ------------------------------------- |
| Frontend         | React, TypeScript, Tailwind CSS, Vite |
| Backend          | Python, FastAPI                       |
| Computer Vision  | OpenCV, Pillow                        |
| AI               | Vision-language model + LLM           |

## Repository layout

```
ai-photography/
├── backend/     # FastAPI service: CV pipeline, EXIF, AI orchestration
├── frontend/    # React SPA: upload UI + analysis report
└── README.md
```

See `backend/README.md` and `frontend/README.md` for per-app instructions.

## Quick start (dev)

```bash
# Terminal 1 — backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Backend runs on http://localhost:8000, frontend on http://localhost:5173.
