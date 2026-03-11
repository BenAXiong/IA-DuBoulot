# IA DuBoulot

Planning-first repository for a supervised AI homework coach web app built for students, parents, and tutors.

## Source Of Truth

- [Original build brief](project_brief_codex.txt)
- [Implementation plan](docs/implementation_plan.md)
- [Brief adjustments](docs/brief_adjustments.md)
- [Branch and PR conventions](docs/branch_pr_conventions.md)
- [Role and access matrix](docs/role_access_matrix.md)
- [Environment matrix](docs/environment_matrix.md)
- [Supabase project setup notes](docs/supabase_project_setup.md)
- [Minors privacy baseline](docs/minors_privacy_baseline.md)
- [Supabase schema V1](docs/supabase_schema_v1.md)
- [Access rules V1](docs/access_rules_v1.md)
- [RLS fixture verification](docs/rls_fixture_verification.md)
- [Smoke checklist V1](docs/smoke_checklist_v1.md)
- [Founder walkthrough V1](docs/founder_walkthrough_v1.md)
- [Launch checklist V1](docs/launch_checklist_v1.md)
- [Sample attachment corpus](docs/sample_attachment_corpus.md)
- [API route map](docs/api_route_map.md)
- [App shell V1](docs/app_shell_v1.md)
- [Student dashboard V1](docs/student_dashboard_v1.md)
- [Student intake V1](docs/student_intake_v1.md)
- [Student session persistence V1](docs/student_session_persistence_v1.md)
- [Student workbench V1](docs/student_workbench_v1.md)
- [Student history and summary V1](docs/student_history_summary_v1.md)
- [Student memory profile V1](docs/student_memory_profile_v1.md)
- [Invitation flows V1](docs/invitation_flows_v1.md)
- [Oversight surfaces V1](docs/oversight_surfaces_v1.md)
- [Privacy controls V1](docs/privacy_controls_v1.md)
- [AI ops and economics V1](docs/ai_ops_economics_v1.md)
- [Service interfaces](docs/service_interfaces.md)
- [Error and audit conventions](docs/error_audit_conventions.md)
- [Storage and attachment rules](docs/storage_attachment_rules.md)
- [MVP to-do list](docs/mvp_todo.md)
- [MVP timeline](docs/mvp_timeline.md)
- [Decision log](docs/decision_log.md)
- [Work sessions log](docs/work_sessions.md)
- [Prompt work log](docs/work_prompt_log.md)
- [Vibestructions](docs/vibestructions.md)
- [Agent operating manual](AGENTS.md)

## Current Status

- Planning docs created on 2026-03-10.
- Public GitHub repository exists at `https://github.com/BenAXiong/IA-DuBoulot.git`.
- The local workspace is initialized as git and connected to `origin`.
- Deployment direction is `Vercel` with a root app at `./`.
- Vercel project exists at `https://vercel.com/bmavmartinez-8475s-projects/ia-du-boulot`.
- Billing direction is `Lemon Squeezy`.
- Primary starter AI direction is `Google Gemini`, with the provider layer kept swappable.
- Next.js app scaffold is now present at repo root.
- Initial Supabase schema migration has been applied to the hosted Supabase project from `supabase/migrations/20260310_000001_initial_schema.sql`.
- Initial RLS policy migration has been applied to the hosted Supabase project from `supabase/migrations/20260310_000002_access_rules_and_rls.sql`.
- Account-link invitation migration has been applied to the hosted Supabase project from `supabase/migrations/20260311_000003_account_link_invitations.sql`.
- Backend contract docs now define the API route surface, service boundaries, error/audit rules, and storage rules.
- Supabase SSR auth helpers, `proxy.ts`, and the first authenticated API routes are now implemented in code.
- Deterministic hosted fixture seed and verification scripts now exist for live RLS visibility checks across student, parent, tutor, and admin roles.
- The first hosted fixture reseed and live RLS verification now pass against the hosted Supabase project with `17` checks and `0` failures.
- A source-controlled sample attachment corpus now exists under `fixtures/homework-samples/` for upload and extraction work.
- The user-facing auth slice is now live with `/auth`, `/auth/confirm`, `/onboarding`, and a protected `/app` entry wired to Supabase SSR plus profile bootstrap.
- The auth slice now supports role-prefilled signup intent, profile editing through `PATCH /api/auth/profile`, canonical invitation records, `/invite/[token]` acceptance, and auth metadata sync from the canonical app profile.
- Same-browser invite confirmation now recovers pending invitation context through the `ia_pending_invite` cookie plus `/auth/complete`, even when the Supabase email template does not preserve `next`.
- The public site now has a shared shell for landing, pricing, auth, onboarding, and invite pages.
- The protected app now has a shared responsive shell plus separate student, parent, tutor, and admin dashboard variants.
- The shell has been checked on 2026-03-11 at emulated iPad portrait and landscape widths with no horizontal overflow on `/auth`, `/app`, or the recovered invite surface.
- The student dashboard now reads a dedicated server snapshot for recent sessions, subject tags, adult-link state, and usage counters.
- `/app/new` now exists as the canonical student intake entry route ahead of the real title/subject/upload flow.
- `/app/new` now hosts the real intake surface for title, subject, staged files, pasted text, graded-homework state, and editable review text.
- validating `/app/new` now persists a conversation draft and redirects into `/app/conversations/[conversationId]`.
- `/app/conversations/[conversationId]` now hosts the real student workbench with a persisted transcript, saveable workspace, private attachment access, upload-triggered extraction, and provider-backed coaching replies.
- `/app/history` now provides the canonical student session list, and the conversation detail page now supports completion plus provider-backed student, parent, and tutor summary generation.
- the current local workspace now contains a build-clean and smoke-verified `A4` slice for Gemini-backed coaching, upload/extraction, moderation event logging, and multi-audience summaries, with deterministic fallbacks preserving the student flow when Gemini fails.
- a fixture-backed local smoke script now exists at `scripts/smoke-student-flow.mjs` and passed on 2026-03-11 against the real `/app/new` -> upload -> workspace -> chat -> complete API flow.
- parent, tutor, and admin oversight surfaces now exist at `/app`, `/app/students/[studentUserId]`, `/app/review/[conversationId]`, and `/app/audit`, backed by explicit oversight services, tutor-note routes, and adult session-view audit logging.
- a second fixture-backed smoke script now exists at `scripts/smoke-adult-oversight.mjs` and passed on 2026-03-11 against the real parent/tutor/admin oversight routes.
- usage tracking, trial/quota enforcement, and Lemon Squeezy billing routes now live behind dedicated `lib/server/usage/` and `lib/server/billing/` services, with student and parent dashboards reading the same server-owned quota snapshot.
- a third fixture-backed billing smoke script now exists at `scripts/smoke-billing-webhook.mjs` and passed on 2026-03-11 against the real webhook route plus the parent dashboard billing surface.
- `/app/settings` now provides the stable profile, billing, privacy, and deletion-control surface for every role, backed by `lib/server/privacy/` plus `POST /api/privacy/deletion-requests`.
- a fourth fixture-backed privacy smoke script now exists at `scripts/smoke-privacy-controls.mjs` and passed on 2026-03-11 against the real settings route, linked-child deletion queueing, immediate tutor-access revocation, redirect-to-settings behavior, and write blocking for deletion-requested accounts.
- the student dashboard and linked-parent student detail now expose a pedagogical memory panel backed by `lib/server/memory/`, with completion-triggered refresh, manual edit/delete controls, and tutor raw-memory access explicitly blocked.
- a fifth fixture-backed smoke script now exists at `scripts/smoke-memory-profile.mjs` and passed on 2026-03-11 against the real memory route, dashboard surfaces, manual mutation flow, and tutor-access boundary.
- a written operator smoke checklist now exists at `docs/smoke_checklist_v1.md`, and `npm run regress:mvp` now gives the canonical pre-demo regression pass across typecheck, build, RLS verification, and all current smoke scripts.
- `A7.3` cost-control guardrails now bound the Gemini-backed path through request-size caps, prompt-context truncation, output-token caps, and idempotent reuse of existing upload-extraction and completion artifacts instead of repeating expensive provider calls.
- launch-candidate operating docs now exist at `docs/founder_walkthrough_v1.md` and `docs/launch_checklist_v1.md`, and the current scope decision explicitly defers PWA installability until after real iPad Safari validation and early beta feedback.
- an experimental prompt-level trace now also exists at `docs/work_prompt_log.md`, while `docs/work_sessions.md` remains the canonical session log.
- a consolidated AI operations and economics note now exists at `docs/ai_ops_economics_v1.md`, including the current quota model, prompt pipeline, guardrails, token-cost ceilings, and the recommended parent-paid policy for future adult-triggered AI features.
- the latest `npm run regress:mvp` pass succeeded on 2026-03-11; the current non-blocking warning profile still consists of documented Gemini fallback usage and optional adult summary variants missing in some student-flow runs.
- the latest student smoke completed successfully while also verifying repeated upload confirmation and repeated completion reuse the existing expensive artifacts; provider reliability remains a QA follow-up even though the student flow stays stable.

## Working Conventions

- Use task IDs from [the MVP to-do list](docs/mvp_todo.md) in session notes, decision log entries, commit messages, and review notes.
- Treat [the decision log](docs/decision_log.md) and [the work sessions log](docs/work_sessions.md) as mandatory maintenance files, not optional notes.
- Update this file whenever a new top-level project doc becomes part of the operating workflow.
