# BCC NIMS - Innovation Roadmap (Fault Logger -> Autonomous NOC Platform)

Last updated: 2026-03-12

## Executive Summary
BCC NIMS will evolve the current Fault Logger into a purpose-built, autonomous Network Operations platform that:

- Detects faults without human input (continuous probing of registered network assets)
- Notifies the correct stakeholders immediately (tiered alerting to IT, HOD, Town Clerk, Director)
- Improves MTTR and contract accountability (SLA enforcement, penalty reporting, breach letters)
- Adds operational intelligence (triage suggestions, repeat-fault detection, predictive risk scoring)
- Improves situational awareness (live network map, mobile-first experience)

This roadmap is designed to be implementable incrementally with the existing stack:

- Backend: FastAPI + SQLAlchemy + PostgreSQL + WebSockets (`backend/main.py`)
- Email: `backend/email_service.py` (async SMTP)
- Frontend: Vite app (`frontend/`)

## Current State (Code Snapshot)
As of 2026-03-12, the codebase provides:

- Authenticated fault creation: `POST /faults/` requires OAuth token (`backend/main.py`)
- Fault lifecycle updates: `PATCH /faults/{id}` supports status changes and broadcasts resolution via WebSocket
- WebSocket broadcast channel: `GET ws /ws` supports push notifications to UI clients
- Email utility: `EmailService.send_email(...)` supports plain text and attachments (`backend/email_service.py`)
- Data model: `FaultLog`, `User`, and `NotificationSubscriber` (`backend/models.py`)
- SLA field present: `FaultLog.is_sla_breach` exists but is not calculated yet

## Guiding Principles
- **No “big bang” rewrites.** Ship in small increments that reduce manual work quickly.
- **Autonomy with guardrails.** Automated actions must be auditable, reversible, and rate-limited.
- **Single source of truth.** Device registry + fault log drive alerts, dashboards, and reporting.
- **Local-first operation.** Core monitoring/alerting must still work during internet outages.
- **Security by default.** Internal probe actions must be authenticated separately from user auth.

## Target Architecture (End State)
High-level components:

- FastAPI app (API + WebSocket + Admin UI endpoints)
- PostgreSQL (faults, devices, notification rules, SLA config, analytics)
- Background services (separate processes):
  - Probe service (ping/SNMP checks)
  - Analytics scheduler (predictive risk scoring, SLA rollups, report generation)
- Frontend (dashboard, network map, admin configuration, PWA shell)

Suggested repo layout additions:

```
backend/
  monitor/
    probe_service.py
    ping_checker.py
    snmp_checker.py
    alert_dispatcher.py
  analytics/
    risk_scoring.py
    sla_rollups.py
  templates/
    emails/
      outage_alert.html
docs/
  bcc-nims-innovation-roadmap.md
```

## Roadmap Overview (Phased Delivery)
Phases are sequenced to maximize operational impact while minimizing risk.

### Phase 0 - Foundation Hardening (1-2 days)
Deliverables:

- Add a **system-to-system auth mechanism** for the monitor service (recommended: `X-Internal-Key` header)
- Add minimal audit fields to faults created automatically (e.g., `logged_by="SYSTEM-MONITOR"`, optional `source="monitor"`)
- Establish consistent severity/status vocabulary across UI + API (Critical/Major/Minor; Open/Investigating/Resolved)

Acceptance criteria:

- Probe service can create and resolve faults without a human OAuth token
- System-created faults are visually identifiable and auditable

### Phase 1 - Automated Email Alerts (Low effort, very high impact) (1 week)
Goal: The system notifies management immediately when outages occur, based on severity tiers.

Backend:

- Extend data model:
  - `NotificationRule` table: maps `severity_tier -> recipients` (role- or email-based)
  - Option: reuse `NotificationSubscriber` and add columns (tier, role, location/isp filters)
- Add alert triggers:
  - On `new_fault` (manual or system): send tiered email
  - On `fault_resolved`: optional “resolved” email for WARNING/CRITICAL
- Add HTML email templates (attach SLA/report links later)

Frontend (admin UI):

- “Notification Rules” screen:
  - Tier recipients (INFO/WARNING/CRITICAL)
  - Optional filters: ISP, location, device type
  - Enable/disable toggles

Operational safeguards:

- Deduplication window (avoid email storms): e.g., no more than 1 email per device per 5 minutes
- Rate limiting: max N emails/minute across system

Acceptance criteria:

- INFO/WARNING/CRITICAL routing matches configuration
- Emails send reliably in staging with a test SMTP server
- Alerts are sent for system-created faults and manual faults equally

### Phase 2 - Autonomous Fault Logging (Ping/SNMP Probe Service) (2-3 weeks)
Goal: Detect outages automatically and create/resolve faults without human input.

Data model:

- Add `NetworkDevice` registry table:
  - `id, name, ip_address, device_type, location, isp_name, snmp_community, is_active`
  - Add `latitude, longitude` later for GIS (Phase 5)
- Add correlation fields to `FaultLog`:
  - `device_id` (FK) or `asset_ref` string
  - `root_event_key` (for dedupe/correlation)

Probe service behavior:

1. Every 60 seconds, for each active `NetworkDevice`:
   - ICMP ping: reachability + packet loss
   - SNMP (where enabled): CPU and interface utilization (MVP: 1-2 OIDs)
2. If device becomes unreachable:
   - Create fault (logged_by `SYSTEM-MONITOR`)
   - Severity policy (configurable):
     - Core Router: Critical
     - Distribution Router: Major
     - Access Point: Major or Minor (site dependent)
3. If device recovers:
   - Auto-resolve the fault (set status to Resolved and resolved timestamp)
4. Broadcast:
   - Push `new_fault` and `fault_resolved` over WebSocket for real-time UI updates

API design notes (recommended):

- Add internal endpoints (key-based):
  - `POST /internal/faults/` (create fault bypassing OAuth)
  - `PATCH /internal/faults/{id}` or `POST /internal/faults/resolve` (resolve by device/event key)
- Keep user-facing `/faults/` endpoints unchanged for now.

Ops/runtime:

- Run probe service as a separate process/service on the same host as API:
  - Windows: NSSM or Task Scheduler
  - Linux: systemd unit
- Store secrets in environment variables, not in DB (except SNMP community if unavoidable; prefer encrypted storage later)

Acceptance criteria:

- Unreachable device generates a fault within 60-120 seconds
- Recovery auto-resolves correctly, with correct timestamps
- No duplicate faults for the same outage (dedupe/correlation works)

### Phase 3 - SLA Enforcement & Penalty Reporting (1 week)
Goal: Turn faults into measurable SLA compliance tracking with automated breach flagging.

Data model additions:

- `SlaPolicy` table:
  - `severity -> target_minutes`
  - Optional: per ISP overrides
- Optional: `FaultLog.sla_target_minutes` snapshot at creation time (prevents policy changes rewriting history)

Backend logic:

- On transition to `Resolved` (`PATCH /faults/{id}`):
  - Compute `resolution_minutes = resolved_at - created_at`
  - Compare to SLA target and set `is_sla_breach` accordingly
- Add monthly SLA report endpoints:
  - Summary: breach count, average MTTR, worst locations, repeat offenders
  - Exports: XLSX + DOCX (breach letter template)

Acceptance criteria:

- `is_sla_breach` is correctly computed on resolve
- Monthly report can be generated for an ISP and a date range

### Phase 4 - AI-Powered Fault Triage (2-4 weeks, iterative)
Goal: Provide root-cause hypotheses and next-action suggestions to speed resolution.

Phase 4a (local, deterministic):

- Rule-based suggestions (fast win):
  - “Repeat fault within 7 days” warning
  - “ISP outage cluster” hint when many faults occur within the same ISP/time window

Phase 4b (lightweight ML):

- Train a classifier on historical faults (TF-IDF + logistic regression):
  - Inputs: `fault_type`, `description`, `location`, `isp_name`
  - Outputs: root cause category + recommended action
- Store model artifact in repo or separate storage; include retraining script.

Phase 4c (optional external LLM):

- Integrate with an API (Gemini or equivalent) behind a feature flag
- Ensure sensitive data redaction (IPs, staff names) before sending

Frontend:

- Display “Suggestion” as a tooltip and a side panel on fault detail view

Acceptance criteria:

- Suggestions show for at least 80% of faults (fallback to rules)
- Users can provide feedback (“helpful / not helpful”) for continuous improvement

### Phase 5 - Live Network Map (GIS Visualization) (2-3 weeks)
Goal: Replace location-only view with a real-time map of all monitored assets.

Data model:

- Add `latitude`, `longitude` to `NetworkDevice`

Frontend:

- Add Leaflet-based “Network Map” view:
  - Markers color-coded by status (green=ok, red=fault, amber=degraded)
  - Click marker to open fault history + current status
  - Live updates via WebSocket (device status events)

Backend:

- Add endpoint for devices list + current status summary:
  - `GET /devices/` and `GET /devices/status/`
- Emit WebSocket events for device status transitions, not only faults

Acceptance criteria:

- Map loads quickly and updates within 1-2 seconds of new events
- Users can locate current critical outages instantly

### Phase 6 - Predictive Alerting (Pattern Recognition) (4-6 weeks)
Goal: Proactively warn IT before high-risk windows or impending failures.

Analytics pipeline:

- Nightly jobs (pandas):
  - Detect periodic outage patterns per ISP/location (day-of-week + hour-of-day clustering)
  - Compute device “risk score” from repeat faults, downtime minutes, packet loss trends

Frontend:

- Risk Score cards on dashboard
- “Upcoming Risk Windows” timeline

Alerting:

- Send proactive email/notification to IT team only (initially)

Acceptance criteria:

- Risk scores are stable (no wild daily swings without new evidence)
- Proactive alerts have a low false-positive rate (target < 20% initially)

### Phase 7 - Mobile Companion App (PWA) (1-2 weeks)
Goal: Field engineers manage faults from phones with push notifications.

Frontend:

- Add `manifest.json` + service worker (Vite PWA)
- Offline-friendly fault list (cached last known state)
- Camera upload flow for attachments
- Web Push notifications for CRITICAL faults (requires push service keys)

Backend:

- Endpoint support for attachment uploads already exists (`POST /upload/{fault_id}`)
- Add push subscription endpoints (store per-user subscription)

Acceptance criteria:

- “Add to Home Screen” works on Android
- Push notifications arrive within 10 seconds for CRITICAL faults

## Feature Backlog (Cross-Cutting Enhancements)
- **Role-based access control**: Admin/Engineer/Viewer capabilities (exists as a `User.role` field; enforce in endpoints)
- **Device onboarding UX**: Bulk import devices (CSV/XLSX)
- **Correlation & incident mode**: group multiple faults into a single incident (for ISP-wide outages)
- **Observability**: structured logs + health endpoints for probe service and API
- **Config management**: store policies and rules in DB; export/import config for DR

## Risks and Mitigations
- **False positives (flapping links)**: require consecutive failures (e.g., 3 of 3 checks) before logging outage
- **Alert storms**: dedupe by device + event key; enforce global rate limits
- **Credentials exposure**: keep SMTP + internal keys in env vars; avoid hardcoding; encrypt SNMP communities later
- **Monitoring host outages**: run probe service on stable host; add watchdog + restart policy
- **Network restrictions**: ICMP may be blocked; allow TCP port checks (443/22) as fallback per device type

## Success Metrics (How We Know This Works)
- Mean Time To Detect (MTTD): < 2 minutes for device unreachable
- Mean Time To Acknowledge (MTTA): < 5 minutes for CRITICAL faults
- Mean Time To Resolve (MTTR): downward trend month over month
- SLA breach rate: measured per ISP with automatic reporting
- Alert delivery success: > 99% in staging; track failures with retries
- False positive rate: < 10% for CRITICAL by Phase 3

## Recommended Implementation Priority (Validated)
1. Automated Email Alerts (Phase 1) - Low effort, very high impact
2. Autonomous Fault Logging (Phase 2) - Medium effort, very high impact
3. SLA Enforcement & Reporting (Phase 3) - Low effort, high impact
4. AI-Powered Triage (Phase 4) - Medium effort, high impact
5. Live Network Map (Phase 5) - Medium effort, medium impact
6. Predictive Alerting (Phase 6) - High effort, medium impact
7. Mobile PWA (Phase 7) - Low effort, medium impact

## Decisions Needed (To Start Phase 1/2)
These decisions unblock implementation without major rework later:

- Internal auth method for probe service:
  - Recommended: `X-Internal-Key` header using a single shared secret
  - Alternative: create a dedicated `system-monitor` user and obtain OAuth token
- Device severity policy:
  - Default mapping by `device_type`, overridable per device
- Alert recipient model:
  - Explicit email lists per tier (simplest)
  - Or role-based recipients tied to `User.role` + subscriber table

