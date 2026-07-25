
# Atlas — Full App Build Plan

The landing page stays as-is (public entry). Everything else is new. Given the scope, I'll ship in phases so you can steer after each one instead of one giant unreviewable dump.

## Foundation (Phase 0 — this turn)

- Enable Lovable Cloud (Supabase) — auth, database, storage, edge functions.
- Enable Lovable AI Gateway (`LOVABLE_API_KEY`) for the voice assistant + text AI.
- Add design-system primitives via shadcn/ui (button, input, card, dialog, dropdown, table, tabs, toast, command, sheet, skeleton, badge, avatar, form, calendar, popover, tooltip, sonner).
- Route architecture:
  - `/` — existing landing (untouched)
  - `/login`, `/signup`, `/auth/callback` — public auth
  - `/app/*` — authenticated shell (pathless `_authenticated/route.tsx` gate + `app` layout with sidebar + top bar + persistent Atlas Voice)
- Wire every landing CTA (Sign In, Get Started, Dashboard, Apply for Pilot) to `/login`.
- Persistent Atlas AI Assistant available on landing + auth + app (extend existing `atlas-voice.tsx`; add context-awareness via route + user; add mute, keyboard shortcut ⌘K/Space-to-talk, streaming responses via Lovable AI, TTS, STT).

## Phase 1 — Auth + Dashboard shell

- Email/password + Google sign-in (Supabase managed).
- `profiles` table + trigger, `user_roles` table + `has_role()` (per user-roles rules).
- `/app` dashboard: "Good morning, {name}." AI-summary hero, today's priorities, revenue at risk, pipeline snapshot, activity feed, quick actions, recommendation cards.
- Global command palette (⌘K) with natural-language routing ("show my pending claims" → `/app/claims?status=pending`).

## Phase 2 — Claims + Supplements + Customers

- Data model: `customers`, `claims`, `claim_events`, `documents`, `photos`, `notes`, `supplements`, `supplement_items`, `adjusters`, `carriers`. RLS + GRANTs per rules.
- Screens: list, detail (timeline, docs, photos, notes), create/edit, AI supplement generation (Lovable AI structured output), review/approval, version history, carrier export stub.

## Phase 3 — Adjusters, Documents, AI Interview, Calendar

- Adjuster directory + profile, carrier relationships.
- Document library with folder tree, upload (Supabase Storage), preview, tags, search, OCR status field (stub for now).
- AI Interview conversational flow (Lovable AI, saved transcripts, generated report).
- Calendar with appointments/inspections/tasks/deadlines.

## Phase 4 — Analytics, Notifications, Search, Admin, Settings

- Analytics dashboards (revenue, claims, supplements, carrier metrics) with recharts.
- Notification center + realtime (Supabase realtime).
- Global search + AI search.
- Admin: users, roles, permissions, company settings, audit logs.
- User profile, voice/notification/theme preferences.

## Atlas Voice — upgraded

- Floating orb on every page (already exists; extend).
- Panel: waveform, listening/thinking/speaking states, streaming word-by-word transcript, mic + mute + keyboard, suggested prompts, conversation history persisted per user in `conversations`/`messages` tables.
- Context awareness: sends current route + selected record IDs as system context.
- Backed by `POST /api/chat` (TanStack server route + Lovable AI streaming) using `google/gemini-3.5-flash` (fast, cheap default for voice; upgrade later if needed).
- STT via `openai/gpt-4o-mini-transcribe`; TTS via `openai/gpt-4o-mini-tts` (both through Lovable AI Gateway) with fallback to browser SpeechSynthesis/Recognition already implemented.

## Technical details

- Framework stays TanStack Start (not Next.js — this workspace is TanStack; your prompt mentioned Next.js App Router, but switching frameworks would delete everything). File-based routing under `src/routes/_authenticated/app.*`.
- Reusable components in `src/components/atlas/*` (shell, sidebar, topbar, page-header, data-table, empty-state, ai-card, etc.).
- All AI calls server-side via `createServerFn` or `/api/chat` route; `LOVABLE_API_KEY` never exposed.
- All Supabase tables get RLS enabled + explicit `GRANT` to `authenticated` and `service_role`.
- No mock data in production paths — seed a small demo dataset for the signed-in user on first login so screens aren't empty.

## What I need from you before Phase 2+

- Confirm the Phase 0 + Phase 1 result looks right, then I proceed.
- If you want a different framework (Next.js) say so now — that's a full reset.

## Phase 0+1 deliverable this turn

Foundation, auth, dashboard shell, persistent Atlas Voice with Lovable AI streaming + context awareness, all landing CTAs wired to `/login`. Phases 2–4 in follow-up turns.
