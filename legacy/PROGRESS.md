# WayMed build progress

This checklist tracks the expanded master brief. Research notes remain tied to
the supplied Civil Hospital Karachi field visit; the WayMed product, map,
doctors, schedules, and operational data remain general-purpose fictional demo
content.

## Milestones

| Milestone | Status | Evidence / next work |
|---|---|---|
| M1 — Project structure, schema, seed data, story | Done | SQLAlchemy/SQLite schema, reproducible seed, synthetic classifier data, and 34-stickies `story.json` exist. |
| M2 — Backend core | In progress | Intake, recommendation, doctor ranking, slots, journey, feedback, story, and route APIs exist. Expanded auth, state machine, bookings, queue, lab/pharmacy states, alerts, family links, and admin import remain. |
| M3 — Graph, routes, anchors, QR | In progress | Fictional three-floor graph, Dijkstra, accessible routes, rerouting, and waiting areas exist. QR anchor/sign workflows and live blocked-node routing remain. |
| M4 — Grounded assistant and speech providers | Not started | No assistant backend or provider capability matrix. |
| M5 — Frontend foundation, i18n, accessibility, PWA | In progress | React/Vite, three UI locales, RTL, font support, responsive UI, and motion exist. Production service worker activates and populates the app-shell cache; offline-mode reload and a dedicated accessibility toolbar remain unverified/incomplete. `.env.example` and its backend settings are wired for local configuration. |
| M6 — Patient journey screens | In progress | Intake through journey tracker exist. Expanded pre-arrival planner, live stages, queue, family, diagnostics, pharmacy, summary, and follow-up remain. |
| M7 — Staff/admin consoles and Talk Mode | Not started | No authenticated staff/admin console, voice-provider layer, or native-speaker testing page. |
| M8 — Story, Presenter, Demo, Future Scope | In progress | Story Mode, traceability, presenter controls, Shams and emergency demos exist. A standalone Future Scope roadmap is connected from traceability and the Test stage; its four roadmap items have Urdu/Sindhi draft displays. Selected Group B insight, POV, HMWs, key stickies, and rationale evidence also have draft displays. Other research-story fields still need translation; full presenter-mode verification remains. |
| M9 — Full validation and deployment | In progress | README, Windows one-command launcher, translation-review inventory, five-minute presentation script, and story/i18n integrity tests are present. Frontend production build passes; backend suite passes (23 tests). Expanded security, concurrency, workflow, voice, complete offline, deployment, and live smoke checks remain. |

## Latest verification

- Frontend production build: passed; Vite reports the main JavaScript chunk exceeds 500 kB.
- Backend regression suite: 23 passed (one upstream AnyIO deprecation warning), including story-integrity checks for the four translated future-scope roadmap items and locale-key parity.
- Locale key parity: 345 keys in each of English, Urdu, and Sindhi; every locale key is included in the translation-review inventory.
- Story integrity: 6 personas, 34 stickies, 5 groups, 4 teacher-review-pending stickies, 8 trace rows; selected problem is Group B HMW 1.
- Synthetic model evaluation: 3,000 training and 1,000 test examples; 38.0% top-1 accuracy and 72.0% top-3 accuracy. Per-department results are reported in `README.md`; these weak demo-only metrics are not clinical claims.
- Translation review inventory covers 345 Urdu and 345 Sindhi UI values, with emergency/safety copy first and every entry marked for native review. Group B and Future Scope research display translations are listed and visibly marked as drafts.
- Browser walkthrough: Future Scope navigation opened all four roadmap items; Urdu showed translated labels and evidence with `lang="ur"` and `dir="rtl"`. Prototype-stage traceability opened the roadmap; its return action restored the Test stage.
- Latest Story Mode browser check: Urdu Define stage displayed translated Group B evidence/HMW with `lang="ur"` and `dir="rtl"`; original English sticky text was not shown for those selected evidence items.
- Browser walkthrough: Story Mode sections, review toggle, RTL layout, route trace, and emergency demo checked. The Shams demo reached all six tracker stages; pause/resume, persistent P2/invented-input attribution, and pain-tag hide/show/dismiss were verified.
- Production PWA check: service worker reached `activated` and `controlled` states and created `waymed-shell-v1`; an actual offline reload is still unverified.

## Explicitly pending user input / external requirements

- Native Urdu and Sindhi review of story translations and voice capability.
- Real ideation scores, selection rationale, usability results, and post-test changes.
- Production credentials, domain, deployment provider, and any configured external speech/LLM providers.
