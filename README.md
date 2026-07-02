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
├── eval/        # Composition-metric evaluation harness (see below)
└── README.md
```

See `backend/README.md` and `frontend/README.md` for per-app instructions.

## Evaluating composition accuracy (`eval/`)

The composition metrics (rule of thirds, leading lines, symmetry, horizon,
negative space, subject position) are heuristic CV — the only way to know if
they're *accurate* is to check them against human judgment on real photos.
`eval/run_eval.py` turns that from eyeballing screenshots into a measured
pass/fail table.

```bash
# 1. Drop real JPEGs into eval/photos/           (gitignored — stays local)
# 2. Copy the example schema and fill in your own judgments per photo:
cp eval/ground_truth.example.json eval/ground_truth.json   # also gitignored
# 3. Run the harness (uses the backend venv):
backend/.venv/bin/python eval/run_eval.py
```

Every ground-truth field is optional — only the axes you give a judgment for
are scored, so you can label incrementally. See the `_schema` block in
`ground_truth.example.json` for what each field means. The labeled photo set
isn't committed (personal photos, personal judgment calls); the harness and
example schema are, so anyone can build their own set.

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
