# Frame Grader — Frontend

React + TypeScript + Tailwind CSS (Vite) single-page app. Handles the upload
experience and renders the analysis report returned by the backend.

## Setup

```bash
npm install
npm run dev
```

Runs on http://localhost:5173. API calls to `/api/*` are proxied to the FastAPI
backend on port 8000 (see `vite.config.ts`).

## Layout

```
src/
├── main.tsx        # React entry point
├── App.tsx         # Root component / layout shell
├── index.css       # Tailwind entry (@import "tailwindcss")
├── components/     # Reusable, presentational UI (buttons, cards, ...)
├── features/       # Feature modules (upload, analysis report, ...)
├── hooks/          # Reusable React hooks
├── lib/            # API client and other non-React utilities
└── types/          # Shared TypeScript types (mirrors backend schemas)
```

`components/` = generic and reusable. `features/` = a self-contained slice of the
product (its own components + state). This keeps feature code colocated and the
shared component library clean.
