# WayMed

WayMed is a general-purpose, fictional healthcare-navigation prototype for a
design-thinking project. It demonstrates a guided intake, explainable
department suggestions, fictional staff and schedules, indoor routes, and a
sample visit journey. It is not connected to Civil Hospital Karachi or any
other real facility.

> **Not a medical tool.** WayMed does not diagnose, triage, or provide treatment
> advice. The recommender and map use fictional demo data. A person who may
> need urgent care should seek local emergency help; do not delay care to use
> this prototype.

## Start locally on Windows

Prerequisites: Windows 10/11, Python 3.11 or newer, Node.js 20 or newer, and
npm. From the project root, double-click `start-waymed.bat` or run:

```powershell
.\start-waymed.bat
```

The script creates a Python virtual environment, installs backend/frontend
dependencies if needed, seeds the fictional database if it is empty, trains
the baseline model if it is missing, and opens the API and web app in separate
terminal windows.

- Web app: <http://127.0.0.1:5173/>
- API docs: <http://127.0.0.1:8000/docs>

Close the two service windows to stop the demo. Seeding preserves an existing
seeded database; it does not reset it. Use
`backend\.venv\Scripts\python.exe backend\scripts\seed.py --reset` only when
you intentionally want to rebuild the local demo database and discard its
stored demo feedback.

## Manual setup

From the repository root in PowerShell:

```powershell
py -3 -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
backend\.venv\Scripts\python.exe backend\scripts\seed.py
backend\.venv\Scripts\python.exe backend\scripts\train_recommender.py
```

Start the API in one terminal:

```powershell
Set-Location backend
..\.venv\Scripts\python.exe -m uvicorn app.api:app --reload --host 127.0.0.1 --port 8000
```

Start the frontend in another terminal:

```powershell
Set-Location frontend
npm ci
npm run dev
```

The frontend uses Vite's local `/api` proxy to reach FastAPI. The root
`.env.example` lists the two supported backend settings; copy it to `.env` for
the Windows launcher to load it. Never put real patient information or
provider secrets in this prototype.

## Verification commands

```powershell
npm --prefix frontend run build
python -m pytest backend\tests -q
python backend\scripts\train_recommender.py
```

The reproducible generator creates **5,000 synthetic labelled records** across
ten departments, with English, Urdu, and Sindhi text fields (3,000 training,
1,000 validation, and 1,000 test examples). Latest local baseline run: **3,000
training examples, 1,000 test examples, 38.0% top-1 accuracy, and 72.0% top-3
accuracy**. Per-department recall on that synthetic test split:

| Department | Recall |
|---|---:|
| Adult Emergency | 0.000 |
| Cardiology | 0.800 |
| Child Emergency | 0.000 |
| ENT/Eye | 1.000 |
| General Medicine | 0.000 |
| Gynaecology | 1.000 |
| Orthopaedics | 1.000 |
| Paediatrics | 0.000 |
| Skin | 0.000 |
| Surgery | 0.000 |

These are reproducible demo metrics, **not clinical performance claims**. The
model performs poorly on this synthetic held-out split and must not be used to
make healthcare decisions. The recommender applies red-flag safety rules
before department suggestions; it still cannot assess a person's medical
condition. The rules and model require substantial validation before any
real-world use.

## Prototype features

- English, Urdu, and Sindhi interface with RTL layout for Urdu and Sindhi.
- Guided patient intake and non-diagnostic department suggestions with reasons.
- Fictional doctor/slot suggestions, three-floor route graph, accessible routes,
  re-routing, family waiting areas, and a journey tracker.
- Story Mode with the supplied research stickies, personas, affinity groups,
  selected HMW, traceability, placeholder ideation scores, and feedback form.
- Presenter controls and sample journeys. Demo patient details and complaints
  are invented, clearly labelled, and not real patient data.
- Service worker app-shell caching. API-dependent actions still require the
  backend; complete offline journeys have not been verified.

## API

All routes are served from FastAPI (the Vite dev server proxies `/api`):

| Method | Path | Purpose |
|---|---|---|
| POST | `/intake` | Store a minimal fictional demo intake |
| POST | `/recommend` | Return red-flag routing or explainable suggestions |
| GET | `/departments` | List demo departments |
| GET | `/doctors?dept=...` | List doctors for a department |
| GET | `/slots?doctor_id=...` | List illustrative available slots |
| GET | `/locations` | List fictional map locations |
| GET | `/route?from=...&to=...&accessible=...` | Find a standard or accessible route |
| POST | `/route/recalculate` | Re-route from a selected landmark |
| GET | `/waiting-areas?from=...` | Find a nearby family waiting area |
| POST | `/journey/events` | Record a demo journey event |
| GET | `/journey/{visit_id}` | Read the demo journey state |
| POST | `/feedback` | Store anonymous prototype feedback |
| GET | `/feedback/summary` | Read aggregate prototype feedback |
| GET | `/story` | Read the design-thinking research story |

## Project structure

- `backend/app/` — API routes, SQLite setup/schema, synthetic data, and
  explainable recommender logic.
- `backend/data/story.json` — supplied research content and traceability source.
- `backend/scripts/` — reproducible database seeding and model evaluation.
- `backend/tests/` — API regression tests.
- `frontend/src/` — React application, patient flow, story mode, locales, and
  design system.
- `frontend/public/` — PWA manifest, service worker, and app icon.
- `PROGRESS.md` — current milestone status, verification, and remaining scope.

## Known limitations and remaining work

This is a prototype, not a deployable hospital system. Authentication,
appointments/bookings, live queues, staff/admin tools, a grounded assistant,
production speech services, real-time workflow integration, and a live
deployment are not implemented. Offline app-shell caching exists, but offline
API journeys are not supported or verified. Native Urdu/Sindhi review and
actual usability-test results are pending; the prototype does not invent
testing outcomes or ideation scores. See `PROGRESS.md` for the expanded scope.

All maps, doctors, availability, and operational facility data are fictional.
Field-research material is kept separate and identified as the team's supplied
research.
