# WayMed: Guidance Network

WayMed helps first-time visitors at a government hospital reach the right department the first
time. The pilot site is Civil Hospital Karachi. Visitors get directions, a slip with a token, and
live token status in **English, Urdu and Sindhi**, on their own phone, at a kiosk or on the
entrance board. They need no account and no smartphone. Staff issue slips, call tokens and answer
"I feel lost" guide requests. Admins edit the floor plan, doctors and facilities, and see
anonymous insights.

> **Before a real pilot:** the floor plan, doctors, schedules and opening hours that ship with
> WayMed are **sample data**, and every Sindhi string is a draft awaiting native review. See
> [Known limitations and pilot checklist](#known-limitations-and-pilot-checklist).

**From the hospital gate to the right department, in your language.**

**One-page summary:** [`WayMed-Patient-Journey.pdf`](WayMed-Patient-Journey.pdf) shows the team, the field
visit, the chosen HMW, the raw idea and the patient journey step by step (what the patient does in the
app, what happens in the hospital, which interview problem it solves). Source:
`docs/journey-onepager.html`; rebuild it with `node scripts/make-journey-pdf.ts`. The same story is on the
home page ("Our design-thinking story") and on slide 2 of the presenter show.

## How to use WayMed in 30 seconds

1. At the gate, open WayMed (scan the poster QR) and tap **I am at the hospital gate**.
2. Walk to the **Slip Room**, choose what you need (Check-up, Child, Women, Surgery, Eye, ENT,
   Test or lab, X-ray, Medicines), and
   tap **Get my slip**. Accident or emergency goes straight to the Emergency route, with no slip.
3. Follow the **Next step** card. Share your location for wrong-turn alerts, or tap
   **I reached …** at each place (checkpoint mode).
4. Sit and wait. The page shows people ahead and a time range, and turns green with a vibration
   when it is **your turn**.

The red **Emergency** button is always at the top. **Help** has a 30-second guide and how to call
a staff member. **More** has facilities, appointments, the voice assistant, the follow-up card
and pre-visit information.

## The visitor app (web app)

- **Five-part journey with a progress bar:** Gate → Slip → Map → Wait → Your turn
  (`/visit/gate` … `/visit/turn`), plus the **Journey, Map, More, Help** navigation.
- **Look and feel:**
  - black and dark-yellow theme, 16px body text, 20–32px headings, buttons at least 48px tall
  - the first screen has a short headline, an animated floor plan, and an animated **How it works**
    strip that plays the five parts of a visit (tap a step to jump to it)
  - a floating **Ask WayMed** voice assistant on every visitor page; it answers in the language you
    type or speak, Sindhi included
  - **After your check-up**: the "Your turn" screen links to the follow-up card
  - one main action per screen
  - smooth transform and opacity animations that switch off with reduced motion
  - Urdu and Sindhi flip right-to-left
- **Web layout:**
  - top navigation (Journey, Map, More, Help) with the language, text-size and red Emergency buttons
  - content at a comfortable reading width; the map step and the demo tour use two columns
  - on narrow screens the navigation moves to a bottom bar with an **Ask** button for the voice
    assistant, so no floating button covers page content on a phone
- **Built for presenting on a phone** (checked at 360, 390 and 430 px, English and Urdu):
  - no sideways scrolling or cut text on any visitor page (`node scripts/check-overflow.ts`, and a
    Playwright test that fails if anything sticks out of the screen)
  - the map opens fitted to the route, labels never smaller than 11 px, pinch/drag/zoom inside the
    map only, a Re-centre button, and a "You are here" tag that never covers a place name
  - QR and deep links open the page straight away with a small language bar on top (only the
    kiosk shows the full-screen language picker)
  - inside the visit each part of the Slip chapter has its own address (`?step=walk|need|yours`),
    so refresh and Back keep your place; routes start from the last place you confirmed
  - one source for facilities ("nearest to you", with how many places have each) and for opening
    hours (`Department.hours`); a closed department says so, says when it opens, and offers a booking
- **No staff, desk or admin link** appears anywhere in the visitor app. Staff open their pages by
  their own address.
- **Slips:** a visitor can take a slip on their phone at the Slip Room
  (`POST /api/public/tokens`, rate-limited to 3 per device per 30 minutes, never for Emergency).
  It joins the real queue, which is why "Medicine has your token 31 and knows you are coming" is
  true in live mode. A printed slip works the same way ("I already have a printed slip").

## How to run the demo

- **Demo tour** (`/tour`, or "Take the demo tour" on the first screen) plays the whole journey
  automatically in about 3.5 minutes (16 scenes, from "Before you come" and booking to the
  follow-up card), in a demo card with captions:
  - a simulated visitor dot and GPS walk
  - a simulated wrong turn, caught by the same wrong-turn detector the real app uses, with the
    alert, vibration and sound
  - the simulated department heads-up

  Controls: Back, Auto-play/Pause, Next, Restart, Exit. Beside the demo card, a panel shows what is
  happening, the journey part, the pain point removed and the matching interview evidence. The
  tour only reads the sample hospital; it writes nothing anywhere.
- **Walk in their shoes** (`/demo/walk`) and the **projector presenter show** (`/demo/show`) are
  under More.
- `/demo` switches a browser tab to in-browser sample data with a "Simulation · Demo data" banner;
  nothing is written to the live system.

## Location and notification limits (honest version)

- **Location is optional**, asked for in plain words, used **only on the phone** (never sent,
  never stored), and only while the Map step is open. It stops when you leave the map or finish
  the visit.
- **Avoiding false alarms:** wrong turns are detected on-device. Readings worse than 20 m
  accuracy are ignored. An alert needs 3 off-route readings in a row, more than 15 m off the route
  plus half the reading's own accuracy.
- **On a wrong turn:** an in-app banner, a vibration, a soft sound and, if allowed, a browser
  notification ("You may be going the wrong way. Turn back to …"). Then the route is recomputed.
- **Indoor GPS is imprecise.** If location is refused, too weak, or the phone seems to be away
  from the mapped area, WayMed uses **checkpoint mode**. The visitor taps "I reached …" or scans
  the landmark QR sticker; a wrong place gives the corrected route straight away. Checkpoint
  buttons are always shown, even with location on.
- **The GPS anchor in the sample data is approximate (Demo data).** Before relying on wrong-turn
  alerts, measure the real gate position and the plan's rotation on site and enter them in the
  hospital data (`hospital.geo`).
- **Notifications while WayMed is closed are limited by browsers.** On iPhone they usually need
  WayMed to be added to the Home Screen first. The in-app alert and vibration are always the
  primary signal. The screen is kept awake during navigation where the browser supports it.

## Everything simulated or sample

| What | Where | Label shown |
|---|---|---|
| Floor plan, landmarks, departments, doctors, schedules, opening hours | `src/data/sampleHospital.ts` | "Sample data" / "Demo data" |
| GPS anchor of the plan | `hospital.geo` in sample data | "Demo data" (README) |
| Facilities (water, washrooms, shaded seating, prayer area, help desk) | sample data | "Demo data" |
| Demo tour: visitor, token MED-031, GPS walk, wrong turn, heads-up, queue | `/tour` | "Simulation · Demo data" |
| Demo mode queue (auto-advancing department) | `/demo`, then the visitor journey | "Simulation · Demo data" banner |
| Wait range before real service times exist | uses the department's usual minutes | "Based on the usual time…" |
| Walk in their shoes "With WayMed" feelings | `/demo/walk` | "Illustrative, from interview stories, not measured" |
| Presenter show impact heatmap | `/demo/show` | "Sample data" |

In live mode, slips, queue, token status, guide requests, bookings and insights are real.

**Contents:** [Quick start](#quick-start) · [Architecture](#architecture-and-why-not-firebase) ·
[Configuration](#environment-variables) · [Deployment](#deployment-https-and-a-custom-domain) ·
[Printing](#printing-slips-stickers-and-signs) · [Kiosk and board](#kiosk-and-entrance-board) ·
[Demo and presenter](#demo-and-presenter-modes) · [Privacy](#privacy-and-data-retention-statement) ·
[Security](#security) · [Staff guide](#staff-onboarding-guide) · [Assistant](#voice-assistant) ·
[Quality](#tests-and-quality) · [Operations](#operations-backups-health-errors) ·
[Pilot checklist](#known-limitations-and-pilot-checklist) · [Assumptions](#assumptions)

---

## Quick start

Requirements: **Node.js 24 or newer** (it uses Node's built-in SQLite and runs TypeScript directly).

```bash
npm install
```

```bash
npm run build
```

```bash
npm run create-admin -- --email admin@hospital.example --name "Your Name"
```

```bash
npm start
```

Open <http://localhost:8080>. An empty database is filled with the **sample** hospital
automatically. `create-admin` asks for a password (at least 10 characters), or reads it from the
`WAYMED_PASSWORD` environment variable. It never takes the password as an argument. Then sign in
at `/login` and create desk and department accounts in **Admin → Staff accounts**.

To give every staff account a new random password, run `node scripts/rotate-staff-passwords.ts`.
The new logins are written to `data/STAFF-LOGINS.txt`, which stays out of Git (`/data/` is ignored).

For development (API with auto-restart plus the Vite dev server on <http://localhost:5173>):

```bash
npm run dev
```

To test from phones on the same Wi-Fi, open `http://<this-computer's-IP>:8080`. QR codes use the
address the page was opened from. Camera, microphone and notifications need HTTPS on anything
other than `localhost`.

### Main screens

| Who | Path | What |
|---|---|---|
| Visitor | `/` | First screen: one sentence, 3 steps, "I am at the hospital gate", demo tour |
| Visitor | `/visit/gate` … `/visit/turn` | The five-part journey (Gate, Slip, Map, Wait, Your turn) |
| Visitor | `/more`, `/help`, `/assistant`, `/tour` | More tab, Help tab, voice assistant, demo tour |
| Visitor | `/g` | Map tab and general QR landing: "Where do you want to go?" → route |
| Visitor | `/t/:id` | Slip QR: live status, wait range, share with family, alert when 3 away, route |
| Visitor | `/w/:landmark` | Landmark sticker QR: "You are here", corrected route, "I feel lost" |
| Visitor | `/f/:id` | Family companion: follow a token from anywhere, nearby facilities |
| Visitor | `/emergency` | Fastest route to Emergency, "tell staff", no slip needed (red button on every screen) |
| Visitor | `/book` | Appointment: department → doctor → slot (no name or phone) |
| Visitor | `/prepare`, `/followup` | Pre-visit page; printable follow-up card in simple Urdu and Sindhi |
| Kiosk | `/kiosk?at=<landmark>` | Scan slip / type token / choose department, Help, 60 s idle reset |
| Display | `/board` | Entrance board: all departments in three languages, flipping numbers |
| Desk staff | `/register` | Issue a slip (optionally urgent), print 80 mm slip |
| Department staff | `/staff` | Next / Recall / Skip, guide requests, doctor availability, block slots |
| Admin | `/admin`, `/admin/signage`, `/insights` | Data and floor-plan editor, signage kit, users, audit; insights |
| Anyone | `/demo`, `/demo/show`, `/demo/walk` | Exhibition mode on sample data, presenter show, "Walk in their shoes" |
| Ops | `/health`, `/api/health` | Health check |

---

## Architecture and why not Firebase

The brief suggested Firebase "unless a clearly better equivalent is justified". WayMed instead
uses a **self-hosted Node.js server** with **SQLite** and **Server-Sent Events**:

1. **It keeps working when the internet doesn't.** Kiosks, boards and desk PCs talk to a server
   on the hospital network, so queues keep moving during an internet outage. Firestore would stop.
2. **Data stays with the hospital.** A government hospital can keep everything on its own server
   or a local VPS. No visitor data goes to a third-party cloud (the optional LLM receives question
   text only, see [Voice assistant](#voice-assistant)).
3. **It can be tested end to end.** Every rule, transaction and acceptance test runs locally and in
   CI with no cloud project and no emulator. (The Firebase emulator also needs Java, which the
   build machine did not have.)
4. **It is cheap and simple to run.** One process, one database file, one Docker image. No per-read
   pricing, no vendor lock-in.

How each Firebase piece in the brief maps to WayMed:

| Brief (Firebase) | WayMed |
|---|---|
| Firestore collections | SQLite tables (`server/db.ts`): entities (hospital, departments, landmarks, edges, facilities, doctors, kiosks), tokens, counters, appointments, slot_blocks, events, aggregates, guide_requests, staff, sessions, audit |
| `firestore.rules` | `server/policy.ts`: one default-deny access table, enforced on every route; tested in `tests/integration/access.test.ts` |
| Realtime `onSnapshot` | `server/realtime.ts`: SSE topics (`queues`, `token:<id>`, `guide:<id>`, `slots:<doctor>`, staff topics). The 3-device test measures under 2 s |
| Cloud Functions | `server/services.ts`, `server/assistant.ts`: transactional operations |
| Firestore TTL | `purgeExpired()` runs every 5 minutes and deletes visit data older than 24 h; aggregates keep counts only |
| Firebase Auth | Staff accounts with scrypt-hashed passwords and httpOnly session cookies (`server/auth.ts`). Visitors never sign in |
| Firebase Hosting | Docker image + Caddy (automatic HTTPS, custom domain), or any Node host with a persistent disk |

**Stack:** React 19 + Vite + TypeScript + Tailwind CSS 4 + React Router · Fastify 5 · Node built-in
`node:sqlite` · Workbox PWA · Vitest · Playwright · Lighthouse. The route engine, queue logic,
slot rules, i18n dictionary and rule-based assistant in `src/lib` are shared by the browser and
the server.

```
src/pages        one file per screen (visitor, kiosk, board, staff, admin, demo)
src/components   floor plan, route view, slip, assistant, layout, language gate, ...
src/lib          route.ts, queue.ts, slots.ts, assistantRules.ts, voice.ts, store.tsx, i18n/
src/lib/backend  live.ts (HTTP + SSE) and demo.ts (in-browser, sample data, never writes to the server)
src/data         sampleHospital.ts (seed / demo / offline fallback), story.ts (interview evidence)
server/          app.ts (routes, validation, headers), policy.ts, services.ts, realtime.ts, auth.ts,
                 assistant.ts, db.ts, seed.ts, create-admin.ts, index.ts
tests/           unit/, integration/ (rules, transactions, retention, realtime), e2e/ (Playwright)
public/audio/sd  folder for native Sindhi voice recordings (see its README)
scripts/         backup, lighthouse, translation checklist, icon renderer
deploy/          Caddyfile          legacy/  earlier FastAPI/React prototype notes (kept, not used)
```

The earlier prototype's `frontend/` and `backend/` folders were locked by another program when
this build was made, so they are still at the project root. Neither the new build nor its tests
use them, and lint and typecheck ignore them. You can move them into `legacy/` or delete them.

---

## Environment variables

Copy `.env.example` to `.env`. Real environment variables override the file. Secrets live only in
the server's environment, never in the browser bundle or in git.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8080` | HTTP port |
| `DATABASE_PATH` | `./data/waymed.db` | SQLite file (back up daily) |
| `SESSION_SECRET` | random per start | **Required in production** |
| `PUBLIC_ORIGIN` | (none) | Your HTTPS origin, e.g. `https://waymed.example.org`; also allowed in the CSRF origin check |
| `NODE_ENV` | `development` | `production` turns on Secure cookies and HSTS |
| `GEMINI_API_KEY` | empty | Optional LLM for the assistant; empty means rule-based answers |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Model name |
| `DEMO_TOOLS` | `false` | Shows "Simulate queue" on `/staff`. Keep `false` in production |
| `RETENTION_HOURS` | `24` | Retention window for visit data |
| `VITE_ERROR_DSN` | empty | Optional hosted error tracker (see Operations) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | empty | First admin, created on start only while no staff accounts exist |

---

## Deployment, HTTPS and a custom domain

### Recommended: Docker + Caddy (on-premise server or any VPS)

1. Point your domain's DNS **A record** at the server, e.g. `waymed.example.org`.
2. `cp .env.example .env`, then set `SESSION_SECRET`, `PUBLIC_ORIGIN=https://waymed.example.org`,
   `NODE_ENV=production` and `WAYMED_DOMAIN=waymed.example.org` (plus `GEMINI_API_KEY` if used).
3. Start it:

```bash
docker compose up -d --build
```

4. Create the first admin inside the container:

```bash
docker compose exec waymed node server/create-admin.ts --email admin@hospital.example --name "Admin"
```

Caddy (`deploy/Caddyfile`) gets and renews the HTTPS certificate and streams live updates
unbuffered (`flush_interval -1`). The database lives in the `waymed-data` volume.

### Fastest: Render or Fly.io (no server to manage)

Both give you an HTTPS address in minutes and let you add your own domain. Push this folder to a
GitHub repository first.

- **Render:** Dashboard → **New → Blueprint** → choose the repository. `render.yaml` sets up the
  Docker service, a persistent disk and a generated `SESSION_SECRET`. Fill in `ADMIN_EMAIL`,
  `ADMIN_PASSWORD` and `PUBLIC_ORIGIN` when asked. A disk needs the Starter plan.
- **Fly.io:** follow the three commands at the top of `fly.toml` (launch, create the volume, set
  secrets including `ADMIN_EMAIL` and `ADMIN_PASSWORD`, deploy). The Mumbai region (`bom`) is
  closest to Karachi.

On first start the server creates the admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, but
only if no staff accounts exist yet. Remove `ADMIN_PASSWORD` afterwards.

### Other hosts

Any host that runs a long-lived Node 24 process with a **persistent disk** works, e.g. Railway
with a volume mounted at `/data`. Use the Dockerfile, set the variables above, add your custom
domain in the host's dashboard, and **run a single instance**: SQLite and the in-memory
live-update hub are per-process.

Static or serverless hosts (Vercel, Netlify, Firebase Hosting alone) are **not suitable for the
live system**. Live updates need a long-lived connection and the database needs a disk.

### Showcase on Vercel (demo only)

`vercel.json` builds a **static showcase**: `npm run build:static` (`vite build --mode static`,
which reads `.env.static` and sets `VITE_STATIC_DEMO=1`). Every page runs on the in-browser
sample hospital with the "Simulation · Demo data" banner, and "Leave demo" is hidden. Nothing is
sent to a server. Import the GitHub repository in Vercel and keep the defaults. To check it
locally: `npm run build:static`, `npx vite preview --port 4173`, then
`node scripts/smoke-static.ts`.

If you put a reverse proxy other than Caddy in front: forward `X-Forwarded-For/Proto`, disable
buffering for `/api/public/stream` and `/api/staff/stream`, and keep idle timeouts above 30 s.

---

## Printing slips, stickers and signs

**Slips (desk).** `/register` → tap a department → a print-ready **80 mm** slip appears. It has the
department colour stripe, shape, icon and name in three languages, a large token, a QR to
`/t/<id>`, three route arrows, the estimated wait, and "This slip holds no personal data" in three
languages. Press **Print slip**, or tick **Print slip** to print after every issue.
For a thermal printer, set paper to 80 mm (roll), margins to none, scale to 100 %, and turn off
browser headers and footers. Chrome's `--kiosk-printing` flag prints without the dialog.

**Landmark QR stickers, department signs, general QR poster, slip template.** `/admin/signage`
(admin). Pick a tab and **Print**. Stickers link to `/w/<landmark>?src=qr`, and the poster links
to `/g?src=qr`. Print stickers at least 5 cm wide, laminate them, and put them at eye level at each
landmark. Test-scan each one after installation. Department signs repeat the same colour, shape
and icon as the slip and the plan, so colour is never the only signal.

**Follow-up card.** `/followup` (also linked from the desk). Staff may type a date and department
before printing. Nothing is saved.

---

## Kiosk and entrance board

**Kiosk.** Open `/kiosk?at=<landmarkId>` (links are listed in **Admin → Kiosks**). Run Chrome in
kiosk mode, e.g. `chrome --kiosk --kiosk-printing https://waymed.example.org/kiosk?at=entrance`,
and allow the camera for the site. The camera only decodes the slip QR in the browser. Nothing is
recorded or sent. If the camera is missing or denied, the kiosk switches to typing the token. After
60 seconds without a touch it returns to the language screen. **Help** sends a guide request for
the kiosk's location.

**Board.** Open `/board` full-screen on the entrance TV (1080p or larger). It shows every
department in three languages, now-serving numbers that flip, a rotating heading language and a
"Next in line" strip. If the network drops it keeps the last numbers and shows
"Offline. Showing the last update from …".

---

## Demo and presenter modes

`/demo` switches **this browser tab** to an in-browser backend with **sample data** and an
always-visible "Simulation" banner. Demo mode never calls the live API, so it cannot write to
production data. Tabs in the same browser stay in sync, so you can show board, phone and staff
side by side. **Leave demo** returns to live mode.

- **Presenter show** `/demo/show`: fullscreen 16:9, one idea per scene, captions, about 4 minutes.
  Slides are laid out at 1280×720 and scaled to the screen. On a phone: swipe or tap, a small
  bottom control bar, no keyboard hints
  on auto-play. Keys: Space/→/PageDown next, ←/PageUp back, A auto-play, P pause, R restart,
  F fullscreen, H hide controls, S safe mode (no animation). A clicker works as arrow keys.
- **Walk in their shoes** `/demo/walk`: Khurshid, Shams or Ashok, "Today" versus "With WayMed",
  labelled "Illustrative, from interview stories, not measured".

All story content (`src/data/story.ts`, `src/data/research.json`) comes only from the team's
field research (P1, P2, P3, D1, S1, S2 and the 34-sticky research wall in five themes).
"Expected" feelings are labelled as hypotheses. No statistics are invented.

---

## Privacy and data-retention statement

- **No accounts for visitors**, no names, phone numbers, ID numbers, symptoms or any medical data.
  A slip is a random token id, a display number (e.g. `PED-007`) and a department.
- **No cameras for tracking, no location or face tracking.** The only camera use is the kiosk
  reading a slip QR on screen, locally, on request.
- **Anonymous events only:** slip issued, QR scanned, kiosk used, "I feel lost", guide requested,
  route viewed, the one-tap "right department first time?" answer, and the **category** of an
  assistant question (never its text). Events carry only categorical fields such as language,
  channel, department or landmark. The server rejects free text.
- **24-hour retention.** Tokens, appointments, events, guide requests and service-time samples are
  deleted 24 hours after creation, checked every 5 minutes. Bookings are limited to the next
  22 hours so a booking and its visit always fit in that window. Only aggregate **counts** are
  kept for insights.
- **No PII in logs.** Request logging is off. Errors log only the route pattern and status. IP
  addresses are used in memory for rate limiting and never stored.
- **Staff data:** name, email, role, department, password hash. The audit log of staff actions is
  kept for 90 days.
- **Assistant:** if an LLM key is configured, the visitor's question text and the public hospital
  facts are sent to the model provider to generate the answer. They are not stored by WayMed.
  Hospitals that do not accept this leave `GEMINI_API_KEY` empty.

---

## Security

- **Default-deny access policy** (`server/policy.ts`). Visitors can only read hospital map data and
  public queue summaries, read one token or guide request by its unguessable id, create allowed
  anonymous events, read slots, book, and ask the assistant. Desk staff issue slips. Department
  staff operate **their own** department's queue and slots. Admins manage data, users, insights
  and audit.
- **Validation everywhere** with zod (strict schemas, size limits, reference checks so the admin
  cannot save a broken map).
- **Rate limits** per IP and per device on public endpoints (assistant 12/min, booking 6 per
  10 min, guide requests 5 per 10 min, login 10 per 15 min, and more), plus a cap on concurrent
  live connections.
- **CSRF:** state-changing calls need a custom header and a same-origin `Origin`. Session cookies
  are httpOnly, SameSite=Strict and Secure in production, and expire after 12 hours.
- **Headers:** strict Content-Security-Policy (no inline scripts), HSTS in production,
  `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `frame-ancestors 'none'`,
  `Permissions-Policy` (camera and microphone for this site only, no geolocation).
- **Passwords:** scrypt hashes, constant-time comparison. Changing a role or password ends existing
  sessions.
- **Audit log** of every staff action (login, issue, next/recall/skip, slot and availability
  changes, data edits, user changes).
- **Transactions:** every write runs in a SQLite transaction. A UNIQUE constraint makes double
  booking impossible.

---

## Staff onboarding guide

Sign in at `/login`. Visitors never sign in.

**Registration desk (role `desk`).** Open `/register`. Tap the visitor's department. Tick
**Urgent** only for priority cases: they are called first. Print and hand over the slip and point
to the coloured signs. Say: "Scan this to see your turn on your phone, or watch the board." For
emergencies, don't issue a slip: send the person to Emergency at once (the red button shows the
route). **Print follow-up card** prints the general reminder card.

**Department staff (role `dept`).** Open `/staff`. Your department is fixed.
- **Next** (key **N**) finishes the current visitor and calls the next one. The phone turns green
  and vibrates, and the board flips, within a second or two.
- **Recall** (**R**) calls the same token again. **Skip** (**S**) marks a no-show as missed (their
  phone says "go to the Registration Desk") and calls the next one.
- **Guide requests** appear live with the landmark. Press **On my way**, then **Close** when done.
- **Doctors and slots:** mark a doctor unavailable, or block or unblock single slots. Booked slots
  cannot be blocked.

**Admin (role `admin`).**
1. **Hospital, Departments** (name in three languages, code, colour, icon, shape, usual minutes per
   visitor, opening hours, bookable).
2. **Floor plan:** drag points to match the real building. Shift-click two points and press
   **Connect** to add a corridor. Select a corridor to mark steps, ramp or lift, or to delete it.
   Routes and the step-free mode update at once.
3. **Facilities** (water, washrooms, shaded seating, prayer area, help desk), **Doctors** and
   weekly schedules, **Kiosks** (copy each kiosk link).
4. **Signage kit:** print and install stickers and signs. **Staff accounts:** create, deactivate,
   reset passwords. **Audit log.**
5. **Insights:** real counts only. Every card shows "Not enough data yet" until it has at least
   5 data points. The heatmap shows where people press "I feel lost", which is where signage
   fails. **Download CSV** exports the counts.

---

## Voice assistant

A floating mic on visitor screens. Speech in uses the Web Speech API (`SpeechRecognition`). Sindhi
recognition is tried first and falls back to Urdu if the browser has no Sindhi. Speech out uses
`speechSynthesis`. Every reply is also shown as text, and tappable suggestion chips are always
offered.

- **Grounded LLM:** with `GEMINI_API_KEY`, the server sends a system prompt that contains **only**
  hospital data (departments, landmarks, facilities, next free appointment, queue sizes, the
  visitor's own token). Answers are capped at about 3 sentences and 420 characters, must be JSON,
  and any action pointing at a place that doesn't exist is dropped.
- **Safety first:** emergency and medical-advice questions are answered by fixed rules **before**
  any model call. Medical questions get "I cannot give medical advice…". Emergencies open the
  Emergency route and say to tell staff.
- **Graceful fallback:** no key, a timeout (8 s), an error, offline, or the rate limit, and the
  assistant answers with the same rule-based engine (`src/lib/assistantRules.ts`), in all three
  languages.
- **Sindhi voice:** most devices have no Sindhi text-to-speech voice. The app then shows the text
  and plays native recordings from `public/audio/sd/` for core phrases (welcome, emergency, your
  turn, turns, arrived). The folder's README lists the phrases to record. It is empty until
  recordings are made.

---

## Tests and quality

```bash
npm run ci
```

That runs lint, typecheck, unit and integration tests, build and end-to-end tests in one go.

| Suite | Command | Covers |
|---|---|---|
| Unit (47) | `npm test` | Route engine (shortest path, step-free, unreachable, turns, nearest facility, trilingual steps), queue logic (urgent first, next/skip/recall, moving average, wait ranges), slots (schedule, booked, blocked, 22 h horizon, Pakistan time), assistant intents and refusals, dictionary parity and Sindhi TODO markers |
| Integration (24) | `npm test` | Access policy (the "security rules" tests: visitors can read only their token and create only anonymous events; role scoping; CSRF; headers), booking race (one 200 and one 409; the UNIQUE constraint holds even when called directly), retention (nothing older than 24 h; counts kept), realtime (phone sees "called" under 2 s after Next), assistant (3 languages, refusal, LLM failure fallback, grounded action filtering, per-device rate limit), insights (real counts, CSV) |
| End-to-end (23) | `npm run build` then `npm run test:e2e` | Desk issues a slip → a second phone opens its QR → a third device presses Next → phone and board update **within 2 s**; a booked slot becomes unavailable to a second user live; landmark QR with a saved token routes from that landmark and a guide request reaches staff; kiosk with camera denied works by typed token; visitor journey in en/ur/sd with `dir=rtl` for Urdu and Sindhi; **directions with the network off** after first load; assistant in three languages with medical refusal; Emergency button; visitor API denial; insights show "Not enough data yet"; **every visitor page fits a 390 px phone in English and Urdu** |

**Latest local run:** lint and typecheck clean · 71/71 unit and integration tests (including
the wrong-turn detector and visitor self-issued slips) · 23/23 end-to-end tests. The visitor-app
tests cover:
- a first screen understood without help, at 16px with 48px buttons, and the How it works steps
- the full live journey on a 375px phone
- a wrong checkpoint giving the corrected route
- **location allowed + walking off-route raising the alert**
- **inaccurate readings raising no alert**
- the demo tour controls
- **no staff link anywhere in the visitor app**
- Urdu and Sindhi right-to-left
- a desktop check: top navigation, 16px text, 20–34px headings, buttons 48–64px tall and no wider than 600px

**Lighthouse** (`npm start`, then `npm run lighthouse`; mobile emulation with throttling).
Initial JavaScript is about 73 KB gzipped (budget 200 KB). Urdu and Sindhi load as separate
small chunks, only when needed.

| Page | Performance | Accessibility | Best practices |
|---|---|---|---|
| `/` (first screen) | 81 | 100 | 100 |
| `/help` (Urdu) | 92 | 100 | 100 |
| `/more` (Sindhi) | 94 | 100 | 100 |
| `/g/paediatrics` (Map) | 84 | 100 | 100 |
| `/emergency` | 83 | 100 | 100 |
| `/book` | 90 | 100 | 100 |
| `/tour` | 94 | 100 | 100 |

Measured on 27 Oct 2026 after the phone redesign. The first screen and the map pages now do more
(the animated How it works strip, the fitted map with label placement), and their performance score
dropped from the mid-90s to the low 80s, mostly in total blocking time on Lighthouse's slowed-down
phone CPU. Scores move several points between runs on the same machine, so re-run before quoting a
number.

**Accessibility and languages:** one dictionary (`src/lib/i18n/*.ts`, same keys enforced by
TypeScript and tests), RTL for Urdu and Sindhi, Noto Naskh Arabic bundled locally, language choice
first on every visitor entry screen, **Larger text** toggle, 18 px minimum text, icon + text +
shape + colour for every department, keyboard and screen-reader labels, reduced-motion support,
light and dark themes.
**Sindhi review:** every Sindhi string carries `TODO: native review`. `TRANSLATION_CHECKLIST.md`
(regenerate with `npm run translations`) lists all 507 strings, with safety strings first.

---

## Operations: backups, health, errors

- **Daily backup:** `npm run backup` makes a consistent copy (`VACUUM INTO`) in `./backups` and
  keeps the newest 14. Schedule it once a day: cron, Windows Task Scheduler, or
  `docker compose exec waymed node scripts/backup.ts`. Copy the folder off the server and protect
  it like the database. Visit data is gone after 24 h anyway; backups protect configuration, staff
  accounts, audit and counts.
- **Health check:** `/health` (page) and `/api/health` (JSON: database, live connections, LLM
  configured). The Docker image has a `HEALTHCHECK`.
- **Error tracking hook:** `src/lib/errors.ts` sends uncaught browser errors (message and route
  only, ids masked, at most 5 per page) to the server log. To use Sentry or GlitchTip, set
  `VITE_ERROR_DSN` and forward from `reportError()`, keeping the no-visitor-data rule.
- **Restore:** stop the server, replace `DATABASE_PATH` with a backup file, start again.

---

## Known limitations and pilot checklist

**Limitations (honest list)**
- Hospital data is **sample**: floor plan, landmarks, doctors, schedules and hours are
  illustrative. Admin shows a warning until real data is saved.
- **Sindhi** text, Sindhi assistant keywords and the Sindhi audio folder need a native speaker.
  Sindhi speech recognition depends on the browser.
- "Alert me when 3 tokens away" works while the page is open, including in a background tab. It
  does not wake a closed browser. That would need Web Push (VAPID keys and a push service), which
  is not included.
- Single-server design: run one instance. That is enough for a hospital pilot. Several buildings
  or very high traffic would need Postgres and a shared pub/sub.
- The wait estimate starts from each department's "usual minutes" setting and only becomes
  measured after 3 real service times. The page says which one it is showing.
- WayMed guides people. It does not shorten lab turnaround, add beds, or fix staffing. The
  interviews raised those issues, and they need hospital decisions.

**Pilot checklist**
- [ ] Written **hospital approval** (administration, IT, and the ethics or quality committee as required)
- [ ] Map the real building in **Admin → Floor plan**; enter real departments, facilities and hours
- [ ] Enter **real doctor schedules** and slot lengths; agree who blocks slots
- [ ] **Signage installation:** print and install landmark QR stickers, department signs, entrance poster; test-scan each one
- [ ] Set up the entrance board and kiosk(s) (Chrome kiosk mode, camera allowed, thermal printer at the desk)
- [ ] **Staff training:** desk, department and guide roles (30 minutes, using `/demo`); create accounts
- [ ] **Sindhi review** of `TRANSLATION_CHECKLIST.md`, and record the `public/audio/sd` phrases
- [ ] Production deployment with HTTPS and custom domain, `SESSION_SECRET` set, daily backup scheduled, `/health` monitored
- [ ] Decide on the LLM (`GEMINI_API_KEY`) after reviewing the privacy note above
- [ ] **Evaluation plan:** one department, two weeks. Measure **task success rate** (reached the right department without help), **time to reach the department** (slip time to first call, from aggregates), and the **first-time-right rate** (the one-tap question). Compare with a baseline observation week before go-live. Report only measured numbers.

---

## Assumptions

- Hospital time is Pakistan Standard Time (UTC+5, no daylight saving) for every schedule, whatever
  the server's time zone.
- One hospital and one floor for the pilot (the data model already stores `floor` per node and department).
- Token numbers restart daily per department (`PED-001`…). The QR uses a random 16-character id,
  so tokens cannot be guessed from the printed number.
- Appointment tokens join the line 15 minutes before their slot. The estimated range shown is the
  slot start to two slot lengths later.
- "Skip" means a no-show: it is marked missed and the next token is called.
- Urdu is the default language until the visitor chooses. Every visitor entry screen asks first.
- Insights cards need at least 5 data points before showing a number.
"# waymed" 
