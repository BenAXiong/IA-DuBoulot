# Decision Log

Related: [README](../README.md) | [Implementation plan](implementation_plan.md) | [MVP to-do list](mvp_todo.md) | [Work sessions log](work_sessions.md)

Use this file to record project-shaping decisions so future sessions do not reverse important choices accidentally.

## Entry Template

### D-YYYYMMDD-XX - Title

- Date: YYYY-MM-DD
- Status: proposed | accepted | superseded
- Related tasks: `A0.0`, `A1.0`
- Context:
- Decision:
- Why:
- Follow-up:

## Current Decisions

### D-20260310-01 - Documentation Spine Is Mandatory

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A0.3.1`, `A0.3.2`, `A0.3.3`, `A0.3.4`, `A0.3.5`
- Context: The repo started with only the project brief. Long-term AI-assisted implementation will fail if future sessions cannot quickly reconstruct project state.
- Decision: `README.md`, `AGENTS.md`, `docs/implementation_plan.md`, `docs/mvp_todo.md`, `docs/mvp_timeline.md`, `docs/decision_log.md`, and `docs/work_sessions.md` are mandatory operating files.
- Why: These files create the minimum traceability system needed to keep code, docs, and workflow aligned.
- Follow-up: Keep the files current whenever scope, architecture, or workflow changes.

### D-20260310-02 - Build Order Prioritizes Governance And Data Contracts

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A0.1`, `A0.4`, `A1.1`, `A1.2`, `A1.3`
- Context: The original brief emphasizes product flow, but implementation risk is concentrated in access control, uploads, AI behavior, and context drift.
- Decision: The first engineering phases are bootstrap/governance and data-contract work before broad UI implementation.
- Why: This reduces rework and lowers the risk of role-visibility bugs and hidden architecture drift.
- Follow-up: Keep schema, RLS, and route maps ahead of feature breadth.

### D-20260310-03 - MVP Target Is A 7-Week Full-Time-Equivalent Build

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A0.1` through `A7.4`
- Context: The product has multi-role auth, uploads, AI orchestration, summaries, privacy constraints, and iPad usability requirements. That is beyond a casual weekend project.
- Decision: Plan around a 7-week full-time-equivalent MVP, with late May 2026 to early June 2026 as the more realistic part-time outcome.
- Why: This keeps expectations grounded and protects the project from false urgency and chaotic shortcuts.
- Follow-up: Reassess the timeline at the end of each completed phase.

### D-20260310-04 - Billing Must Be Abstracted But Can Be Integrated Late

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A0.2.5`, `A1.3.2`, `A6.3.1`, `A6.3.2`, `A6.3.3`
- Context: Billing provider feasibility depends on geography and entity setup, which may not be settled immediately.
- Decision: Define a billing service interface early, but delay provider-specific implementation details until the rest of the MVP is stable.
- Why: This prevents external provider uncertainty from contaminating the core product architecture.
- Follow-up: Choose the provider during `A0.2.5` and keep UI/database logic provider-agnostic.

### D-20260310-05 - Product Name And Language Scope Are Locked For MVP

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A0.1.3`, `A0.4.3`
- Context: The founder confirmed the product naming and language direction after the initial planning pass.
- Decision: The product name is `IA DuBoulot`. MVP interface targets French, English, and Chinese UI surfaces. AI assistance starts with French first, with English added only if it is low-effort after the French flow is stable.
- Why: This removes naming drift and keeps multilingual scope realistic.
- Follow-up: Reflect the language split in copy, prompt work, and UI localization planning.

### D-20260310-06 - Modular Architecture Is A Hard Requirement

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A1.3`, `A2.1.5`
- Context: The project will be built over many AI-assisted sessions, which makes large mixed-responsibility files especially dangerous.
- Decision: The codebase must avoid god components, god hooks, god services, and hidden business logic in UI helpers. Pages, route handlers, and server actions should stay thin and delegate to focused modules.
- Why: This preserves maintainability, reviewability, and future-session comprehension.
- Follow-up: Enforce this with scaffolding conventions, linting, and code review discipline.

### D-20260310-07 - Deployment Target Is Vercel

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A0.1.4`
- Context: The founder confirmed Vercel as the preferred deployment platform for the Next.js MVP.
- Decision: Use Vercel for preview and production deployments, with the app rooted at `./` unless the repository structure changes later. The current Vercel project is `https://vercel.com/bmavmartinez-8475s-projects/ia-du-boulot`.
- Why: This is the lowest-friction deployment path for a Next.js MVP and aligns with preview-first iteration.
- Follow-up: Connect the repo and wire environment variables there.

### D-20260310-08 - Gemini Is The Primary Starter AI Provider

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A0.2.4`, `A4.1`
- Context: The founder wants to start with Gemini credits and keep costs low at the beginning.
- Decision: Implement the first AI integration against Google Gemini while preserving a swappable provider layer. Fallback provider remains open. Treat free-tier Gemini use as internal prototyping until provider-side data handling is acceptable for minors.
- Why: It reduces startup cost while keeping the architecture flexible if pricing, policy, or quality changes.
- Follow-up: Select and record the fallback provider before production hardening, and confirm the production Gemini tier does not use child data for provider-side product improvement.

### D-20260310-09 - Billing Provider Is Lemon Squeezy

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A0.2.5`, `A6.3`
- Context: The founder selected Lemon Squeezy for MVP billing.
- Decision: Build the billing abstraction against Lemon Squeezy webhooks and subscription lifecycle events.
- Why: It resolves provider uncertainty early enough to shape the billing interface without blocking the rest of the build.
- Follow-up: Confirm exact Lemon Squeezy product, variant, tax, and webhook requirements during `A6.3`.

### D-20260310-10 - Under-13 Privacy Will Use A Provisional Baseline Before Final Legal Copy

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A0.4.4`, `A6.4`
- Context: The founder wants to support children under 13 but does not yet have final answers for every consent, retention, and deletion detail.
- Decision: Use [docs/minors_privacy_baseline.md](minors_privacy_baseline.md) as the chosen MVP implementation baseline now, then refine the exact policy and copy before launch.
- Why: Auth, schema, provider handling, and deletion workflows cannot be designed responsibly if minors privacy remains completely unspecified.
- Follow-up: Convert the provisional baseline into finalized product/legal requirements before beta launch.

### D-20260310-12 - Under-13 MVP Defaults Favor Parent-Linked Supervised Access

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A0.4.4`, `A5.1`, `A6.4`
- Context: The founder asked for reasonable under-13 defaults to avoid spending early project time on first-principles policy design.
- Decision: The MVP baseline uses parent-linked under-13 accounts, age-band collection instead of full birth date, 7-day pending-consent cleanup, 180-day inactivity review for child content, 12-month sensitive-access audit retention, and parent-controlled deletion requests with a 30-day live-data purge target.
- Why: This is conservative enough to shape architecture now without forcing heavy operational/legal machinery into day-one implementation.
- Follow-up: Validate the final consent copy, retention wording, and support process before beta launch.

### D-20260310-13 - Main Branch Uses Active Protection Without Mandatory PRs Yet

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A0.1.2`, `A0.1.5`
- Context: The repo now needs durable `main` protection, but the founder is still in a fast bootstrap phase with heavy direct Codex usage and no CI gates yet.
- Decision: Use an active GitHub ruleset on `main` with deletion and force-push protection, but leave `Require a pull request before merging` off for now. Prefer squash merges when PRs are used, and switch to mandatory PRs later once CI and a steadier review flow exist.
- Why: This protects the branch without blocking direct pushes during bootstrap.
- Follow-up: Add required status checks and consider turning PR enforcement on once CI exists.

### D-20260310-14 - Role Access Is Defined By Explicit Links And Audited Sensitive Reads

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A0.4.1`, `A1.2`
- Context: Student, parent, tutor, and admin visibility is the core product trust surface.
- Decision: All non-student access to student learning data must flow through explicit parent-student or tutor-student links, and sensitive reads remain auditable.
- Why: This keeps the access model explainable and implementable in RLS and server authorization.
- Follow-up: Implement the SQL and RLS policies directly against the access matrix.

### D-20260310-15 - App Data References public.users, Not auth.users Directly

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A1.1.1`, `A1.1.2`, `A1.1.5`
- Context: Supabase provides `auth.users`, but the product needs explicit roles, under-13 state, and lifecycle fields that do not belong in auth metadata alone.
- Decision: Keep `auth.users` as the identity source of truth, create `public.users` as the app user table, and have the rest of the domain model reference `public.users`.
- Why: This keeps product authorization, role logic, and lifecycle state explicit and queryable without coupling the whole app to auth internals.
- Follow-up: Define the onboarding flow that creates and maintains `public.users` rows during `A2.2`.

### D-20260310-16 - Enable RLS In The Raw SQL Migration Before Writing Policies

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A1.1`, `A1.2`
- Context: The first schema draft is written in raw SQL, and Supabase documents that raw SQL tables in `public` do not automatically get RLS protection the same way dashboard-created tables often do.
- Decision: Enable RLS on every app table directly in the initial migration, then add policies in `A1.2`.
- Why: It is safer to have locked tables with missing policies than exposed tables with forgotten RLS.
- Follow-up: Write table-by-table policies next and do not expose any browser data flow before that pass is complete.

### D-20260310-17 - Direct Browser RLS Stays Stricter Than Product Capability

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A1.2.1`, `A1.2.2`, `A1.2.3`
- Context: Some product actions, especially billing, summaries, moderation, and audit writes, should not be exposed as broad browser-level table mutations even if the product eventually allows those outcomes.
- Decision: Keep direct authenticated table access conservative in RLS, and reserve privileged writes for server-side or service-role paths where needed.
- Why: This reduces accidental exposure while the app is still gaining server-side authorization layers.
- Follow-up: Mirror these constraints explicitly when server routes and server actions are implemented.

### D-20260310-18 - Sensitive App Logic Lives In Thin Routes Plus Domain Services

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A1.3.1`, `A1.3.2`, `A1.2.3`
- Context: After schema and RLS, the next risk is letting route handlers absorb provider logic, authorization logic, and multi-table mutation logic in an ad hoc way.
- Decision: Use Next.js route handlers only as transport layers under `app/api`, and place authorization, orchestration, provider calls, and privileged writes in server-only domain services under `lib/server`. Billing, summaries, moderation, memory updates, and profile bootstrap should not rely on direct client table mutations as their canonical path.
- Why: This preserves modularity, keeps provider integrations swappable, and aligns server behavior with the conservative RLS model.
- Follow-up: Implement shared server authorization helpers and the first `AccountService` and `ConversationService` slices next.

### D-20260310-19 - Routes Use A Shared Error Envelope And Explicit Audit Boundaries

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A1.3.3`, `A1.2.3`
- Context: Without a fixed error contract, future route handlers will leak provider details, expose inconsistent statuses, and bury sensitive actions in ad hoc logging.
- Decision: Use one shared API error envelope with stable error codes, request IDs, and retryability hints. Keep `audit_logs` for sensitive access and business events only, keep `moderation_events` for safety outcomes, and keep general debug/runtime traces in application logs instead of database tables.
- Why: This keeps client behavior predictable, preserves trust boundaries, and prevents the audit table from becoming noisy or unusable.
- Follow-up: Implement shared route error helpers and an explicit audit service before sensitive route work expands.

### D-20260310-20 - Student File Storage Uses Private Canonical Buckets With Deterministic Paths

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A1.3.4`, `A3.2`, `A4.3`
- Context: Upload work will break traceability quickly if bucket names, file limits, and metadata keys are scattered across route handlers or UI code.
- Decision: Use private Supabase buckets with `homework-attachments` as the canonical source bucket and `processing-artifacts` as the internal derived bucket. Use deterministic ID-based paths, short-lived signed read URLs, and documented `attachments.metadata` keys. Bucket names are source-controlled constants, not env vars.
- Why: This keeps storage access safe for minors, avoids hidden path logic, and makes future upload/extraction work easier to reason about.
- Follow-up: Create the buckets when upload implementation begins and centralize the constants in server code instead of hardcoding them across routes.

### D-20260310-21 - Auth Bootstrap Uses SSR Session Reads And Service-Role Profile Writes

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A1.2.3`, `A2.2.1`, `A2.2.3`
- Context: `public.users` is protected by RLS, and self-service route handlers need a clean way to read the authenticated session, create or repair the caller profile, and write audit events without leaking privileged credentials to the client.
- Decision: Use Supabase SSR cookie-based clients for session reads, a repository-local `proxy.ts` to refresh auth cookies, and service-role server helpers only for privileged server writes such as profile bootstrap repair and audit logging. The first implemented auth slice is `GET /api/auth/me` and `POST /api/auth/profile/bootstrap`.
- Why: This keeps session validation tied to the user cookie while preserving a clean server-only path for writes that should not depend on client-side table mutations or relaxed RLS.
- Follow-up: Reuse the same split for future sensitive routes and extend the auth slice into protected UI onboarding next.

### D-20260310-22 - RLS Verification Uses Deterministic Hosted Fixtures

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A1.2.4`, `A1.4.1`, `A1.4.3`
- Context: Reading RLS SQL is not enough. The project needs repeatable proof that real hosted Supabase policies produce the intended visibility for student, parent, tutor, and admin accounts.
- Decision: Use deterministic fixture auth accounts, fixed domain-row identifiers, a local-only shared fixture password, and two operator scripts: one to reseed the hosted fixture dataset and one to verify the expected visibility and mutation boundaries through authenticated anon-key clients.
- Why: This validates the deployed RLS behavior directly, keeps regression checks reproducible across future sessions, and avoids mixing test-only logic into the product runtime.
- Follow-up: Rerun the fixture scripts after any schema, RLS, or sensitive server-authorization change, and keep `A1.4.2` open until real sample attachment files are added.

### D-20260310-23 - Upload And Extraction Work Uses A Source-Controlled Sample Corpus

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A1.4.2`, `A3.2`, `A4.3`, `A7.2`
- Context: Future upload and extraction work will drift quickly if every session invents new demo files, extracted-text snippets, and metadata expectations from scratch.
- Decision: Keep a canonical sample corpus under `fixtures/homework-samples/`, with original files in `attachments/`, paired extracted-text baselines in `extracted/`, and one `manifest.json` entry point. The operating explanation lives in [docs/sample_attachment_corpus.md](sample_attachment_corpus.md).
- Why: This keeps upload fixtures stable, reviewable, and reusable across route work, extraction work, and smoke checks.
- Follow-up: Extend the corpus only through paired file-plus-manifest updates, and reuse it before adding new ad hoc samples.

### D-20260310-24 - Auth Uses A Guarded /auth -> /onboarding -> /app Flow

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A2.2.1`
- Context: The repo already had SSR auth helpers and bootstrap APIs, but not a usable user-facing path that exercised them end to end.
- Decision: Use `/auth` for email/password entry, `/auth/confirm` for SSR-friendly email confirmation, `/onboarding` for profile bootstrap, and `/app` as the protected temporary app entry. Page-level guards redirect unauthenticated users to `/auth` and unbootstrapped users to `/onboarding`.
- Why: This connects the real Supabase session lifecycle to the existing bootstrap/backend contracts without waiting for the full role-aware dashboard work.
- Follow-up: Extend this into parent/tutor invite flows and richer protected shells during `A2.2.2`, `A2.2.3`, and `A2.3`.

### D-20260310-25 - public.users Stays Canonical While Safe Fields Mirror Into Auth Metadata

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A2.2.3`, `A2.2.4`
- Context: The app already treats `public.users` as the canonical profile record, but user-facing auth flows and later invite/link logic still benefit from lightweight auth metadata carrying the current role and profile status.
- Decision: Keep `public.users` as the source of truth, and mirror only safe profile fields into Supabase auth `user_metadata` during bootstrap and profile updates: role, display name, UI language, AI help language, age band, under-13 flag, account status, and onboarding completion state.
- Why: This preserves a clean canonical data model while giving the auth layer enough context for redirects, operator inspection, and future flow hardening.
- Follow-up: Reuse the same sync rule for invite acceptance and parent-approval flows instead of adding a second canonical profile source.

### D-20260311-26 - Parent Approval And Tutor Access Use Canonical Invitation Rows

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A2.2.2`
- Context: The auth slice already supported signup, confirmation, onboarding, and protected routes, but parent approval and tutor linkage were still implicit future routes. Burying those flows in raw query params or ad hoc auth metadata would damage traceability and make access audits weak.
- Decision: Add `public.account_link_invitations` as the canonical pre-link object for parent approval and tutor access, expose `/invite/[token]` as the shared acceptance surface, and keep raw token handling server-side with hashed persistence only. V1 invite delivery returns copyable invitation URLs instead of waiting for transactional email infrastructure.
- Why: This keeps link state explicit, auditable, and durable across future sessions while avoiding insecure shortcuts. It also separates access-control correctness from unfinished provider-email work.
- Follow-up: Apply `supabase/migrations/20260311_000003_account_link_invitations.sql` to the hosted project, then later add provider-backed invite delivery and cleanup jobs for expired rows.

### D-20260311-27 - Public And Protected Shells Are Split Before Student Workflow Breadth

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A2.3.1`, `A2.3.2`, `A2.3.3`
- Context: The repo had real auth and invite flows, but the UI still leaned on isolated pages and one temporary `/app` screen. That structure would quickly collapse into duplicated layout code and a god dashboard component once the student workflow started.
- Decision: Keep one shared public shell for landing, pricing, auth, onboarding, and invite pages, and one shared authenticated shell for `/app`. Split role-specific dashboard content into separate modules per role instead of growing a single mixed `/app/page.tsx`.
- Why: This creates stable chrome boundaries now, keeps future route work easier to reason about, and reduces the chance of role-specific behavior getting buried inside a generic layout file.
- Follow-up: Manually validate the shell on iPad portrait and landscape widths, then extend the student dashboard into the real homework intake flow in phase A3.

### D-20260311-28 - Shared Client Env Access Must Use Direct NEXT_PUBLIC References

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A2.2.2`, `A2.3.4`
- Context: The shared env helper originally read variables through dynamic `process.env[name]` access. In Next.js client bundles, that pattern prevented `NEXT_PUBLIC_*` values from being inlined, which broke the browser Supabase client during hydration even though the env vars existed locally and in deployment config.
- Decision: Keep shared env access on direct `process.env.NEXT_PUBLIC_*` property reads instead of dynamic lookup for any value needed by client code.
- Why: This keeps browser auth and other public client integrations reliable across build and runtime environments.
- Follow-up: Keep server-only secrets out of client modules, and avoid reintroducing dynamic env-name lookup in files imported by client components.

### D-20260311-29 - Same-Browser Invite Recovery Uses A Pending Cookie Plus Post-Confirm Bridge

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A2.2.2`, `A2.3.4`
- Context: The generic Supabase confirm-signup email template does not preserve invite-specific `next` redirects. Without an explicit recovery path, invited users would confirm their email and lose the pending invitation context.
- Decision: Persist the invite token in a short-lived `ia_pending_invite` browser cookie before signup, recover it inside `/auth/confirm`, and redirect through `/auth/complete` before returning to `/invite/[token]`.
- Why: This restores the pending invite automatically for the same browser session without depending on provider-specific email-link customization.
- Follow-up: If cross-device invite recovery becomes important, add a server-tracked pending-invite recovery token instead of relying only on a browser-local cookie.

### D-20260311-30 - Student Dashboard Reads One Server Snapshot And Gates /app/new

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A3.1.1`, `A3.1.2`, `A3.1.3`
- Context: The first student dashboard variant was mostly placeholder copy. Moving into the real workflow risked either burying Supabase queries inside the page tree or faking progress with static cards disconnected from account state, session history, and adult-link status.
- Decision: Add a dedicated `lib/server/student-dashboard` service that builds one student-dashboard snapshot from `student_profiles`, `parent_student_links`, `tutor_student_links`, `conversations`, and `usage_counters`. Use that snapshot to drive the student dashboard and gate the canonical intake entry route at `/app/new`.
- Why: This keeps the page thin, avoids a god dashboard component, and gives future A3 work a stable place to extend when title/subject entry, uploads, and conversation creation arrive.
- Follow-up: Mount the real intake form on `/app/new` in `A3.2`, and keep named adult display out of the student UI until there is an explicitly-authorized server-side path for it.

### D-20260311-31 - Student Intake Is Implemented Before Persistence And OCR

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A3.2.1`, `A3.2.2`, `A3.2.3`, `A3.2.4`
- Context: The new `/app/new` route needed to become a real student workflow surface, but the conversation APIs, upload-confirm routes, and extraction pipeline are still future work. Binding the intake UI directly to unfinished persistence would either force throwaway APIs or delay meaningful UX work.
- Decision: Implement the intake form now as a protected, browser-local staging surface with explicit limits, file-type validation, pasted-text input, graded-homework toggle, and an editable extracted-text review panel. Keep conversation creation, attachment persistence, and true OCR out of this slice.
- Why: This lets the product lock the student-facing intake contract early while preserving the intended separation between intake (`A3.2`), persistence (`A3.3`), and extraction (`A4.3`).
- Follow-up: Replace local staging with real `conversations` and `attachments` persistence in `A3.3`, then connect the review panel to the extraction pipeline in `A4.3`.

### D-20260311-32 - A3.3 Persists The Intake Contract Before Real Upload Storage

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A3.3.1`, `A3.3.2`, `A3.3.3`
- Context: The intake form was now stable enough to persist, but the upload/create/confirm route family and extraction pipeline were still not implemented. Waiting for true binary upload persistence would have blocked draft restoration and return-to-session behavior entirely.
- Decision: Persist the intake contract now through `conversations`, `workspace_states`, and one initial student `messages` row. Carry selected file references forward as human-readable session context instead of inventing fake `attachments` rows before the storage path exists.
- Why: This makes the student flow durable and reopenable without violating the storage contract or pretending uploaded binaries already exist in Supabase storage.
- Follow-up: Replace text-only attachment references with real `attachments` rows when the upload route family lands, and keep the session detail route as the canonical return surface.

### D-20260311-33 - A3.4 Locks The Student Workbench Contract Before Real AI

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A3.4.1`, `A3.4.2`, `A3.4.3`, `A3.4.4`
- Context: The student flow already created durable conversations, but `/app/conversations/[conversationId]` was still only a return surface. Waiting for the full AI provider layer and upload pipeline would have left the core session UX undefined and encouraged later god-route or god-component behavior.
- Decision: Turn the conversation route into a real student workbench now, backed by thin mutation routes for message appends and workspace saves. Keep the assistant behavior server-owned through a deterministic draft-coach helper, and keep upload controls limited to validated text-only file references until the upload route family exists.
- Why: This locks the chat/workspace interaction contract, keeps the route and service boundaries explicit, and lets later AI/upload work replace narrow internals instead of redesigning the session surface from scratch.
- Follow-up: Replace the deterministic reply helper with the `A4` provider layer, convert workspace upload references into real `attachments` rows, and build the `A3.5` history/summary slice on top of the new workbench.

### D-20260311-34 - A3.5 Makes Session Completion Deterministic Before Real Summary AI

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A3.5.1`, `A3.5.2`, `A3.5.3`
- Context: The student workbench was now live, but there was still no canonical way to end a session, persist a summary, or browse long-form history. Waiting for the future AI summary layer would have left the product without a stable closure contract and kept `session_summaries` effectively theoretical.
- Decision: Add `/app/history` as the canonical student history route, extend the conversation detail surface to show summary state, and make `POST /api/conversations/[conversationId]/complete` mark the session completed while upserting one deterministic student summary.
- Why: This activates the history and summary contract now, keeps the route/service split narrow, and lets later provider-backed summary generation replace a focused helper instead of redefining session completion behavior.
- Follow-up: Replace deterministic student summaries with provider-backed generation in `A4`, add parent/tutor summary audiences in `A4.5`, and connect real attachment metadata once upload routes exist.

### D-20260310-11 - Personal AI Subscriptions Are Not Backend Fallback Providers

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A0.2.4`, `A4.1`
- Context: The founder has a personal AI subscription under active use and mentioned it as a possible fallback.
- Decision: Do not treat founder personal subscriptions as application-backend fallback providers. The production-capable API fallback remains open, with OpenAI API as the likely later candidate after MVP validation.
- Why: Personal subscriptions are not a clean deployable backend dependency and create unclear rate-limit, terms, and operational risks.
- Follow-up: Select the real API fallback when production load and paid-user economics justify it.

### D-20260311-35 - Phase A4 Reuses The Existing Student Flow Instead Of Adding Parallel AI Surfaces

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A4.1.1`, `A4.1.2`, `A4.1.3`, `A4.2.1`, `A4.2.2`, `A4.2.3`, `A4.2.4`, `A4.3.1`, `A4.3.2`, `A4.3.3`, `A4.3.4`, `A4.4.1`, `A4.4.2`, `A4.4.3`, `A4.4.4`, `A4.5.1`, `A4.5.2`, `A4.5.3`, `A4.5.4`
- Context: The student flow was already stable enough that adding a second temporary AI path would have created more drift than value. The local workspace now contains Gemini-backed provider modules, upload/extraction routes, moderation handling, and summary generation wired directly into the same `/app/new` and `/app/conversations/[conversationId]` flow that A3 established.
- Decision: Implement Phase A4 by replacing the deterministic internals inside the existing student intake, workbench, and completion flow instead of introducing parallel experimental routes or duplicate UI surfaces. Keep the A4 modules split by responsibility under `lib/server/ai`, `lib/server/uploads`, `lib/server/moderation`, `lib/server/summaries`, and `lib/server/translations`.
- Why: This preserves the thin-route, narrow-service architecture, avoids duplicated product contracts, and makes the A4 rollout a stability pass on one canonical student workflow instead of a second application hidden beside it.
- Follow-up: Keep task closure conservative until targeted end-to-end smoke verification is logged, confirm deployed env parity for Gemini-backed behavior, and tighten upload enforcement so the implementation matches the documented storage contract exactly.

### D-20260311-36 - Student Completion Responses Must Not Leak Adult Summary Audiences

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A4.4.3`, `A4.4.4`, `A4.5.1`, `A4.5.2`, `A4.5.3`, `A4.5.4`
- Context: The A4 completion pipeline now generates student, parent, and tutor summaries in one service call. During the first end-to-end student-flow smoke design, the student completion route was found to return that full summary array directly, which would leak adult-only content even though later detail reads rely on RLS-filtered visibility.
- Decision: Keep multi-audience summary generation and storage as-is, but treat the student completion response as a student-only surface and return only the student-visible summary subset from that route path.
- Why: Visibility rules must hold at every boundary, not only on later reads. Filtering the response at the completion boundary closes the leak without weakening the downstream parent/tutor summary pipeline.
- Follow-up: Keep the smoke script asserting that the student completion response only contains the student audience, and apply the same boundary check to any future admin or adult completion surfaces before they ship.

### D-20260311-37 - Assistant Chat Turns Are Persisted Through The Admin Boundary

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A4.4.1`, `A4.4.2`, `A4.4.3`, `A4.4.4`
- Context: The hosted RLS rules intentionally allow direct `messages` inserts only for student-authored rows. During the A4 student-flow smoke, the chat route reached Gemini successfully but failed when it tried to persist the assistant reply through the student-scoped Supabase client.
- Decision: Keep student-authored reads and conversation ownership checks on the student-scoped server client, but persist assistant/system-generated message rows and their activity timestamp updates through the admin Supabase boundary.
- Why: This matches the documented access model, preserves conservative direct-browser RLS, and keeps privileged system writes explicit instead of weakening the `messages` table policy to accommodate server internals.
- Follow-up: Keep the student-flow smoke asserting that a real assistant turn persists successfully after the provider call, and route any future system-generated conversation rows through the same privileged write boundary.

### D-20260311-38 - Student Completion Stays Available Even If Adult Summary Derivations Fail

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A4.5.1`, `A4.5.2`, `A4.5.3`, `A4.5.4`
- Context: The A4 smoke exposed intermittent Gemini failures on parent translation and tutor-summary derivations after the required student summary had already been generated successfully. Blocking `POST /api/conversations/[conversationId]/complete` on those secondary adult artifacts would leave the student unable to finish the session for reasons they cannot act on.
- Decision: Treat the student summary as the required completion artifact, but make parent/tutor summary generation and translated parent variants best-effort during the student completion path. Log failures for those optional adult artifacts and continue returning a successful student completion response.
- Why: This preserves the student-facing closure contract, matches the current product priority where adult surfaces are not yet the active workflow, and keeps optional provider instability from turning into a hard student regression.
- Follow-up: Keep the smoke script reporting missing adult variants explicitly, and revisit stricter guarantees once the A5 parent/tutor review surfaces are live and have their own retry or repair workflows.

### D-20260311-39 - Attachment Confirmation Degrades Gracefully On Extraction Provider Failure

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A4.3.1`, `A4.3.2`, `A4.3.3`, `A4.3.4`
- Context: The A4 smoke exposed intermittent Gemini extraction failures during `POST /api/uploads/confirm`. Returning a hard `502` at that point broke the student flow even though the file upload itself had succeeded and the product already has a UI contract for manual review when extraction is weak or unavailable.
- Decision: Keep successful uploads durable even when extraction fails. On provider extraction failure, mark the attachment `failed`, persist failure metadata, return a warning message, and let the student continue with the attachment plus manual review instead of failing the whole confirmation route.
- Why: This matches the documented graceful-fallback rule for extraction, prevents provider instability from invalidating a completed upload, and keeps the student moving through the workflow with an explicit manual-review signal.
- Follow-up: Keep the smoke script treating both `ready` extraction and `failed with warning` as valid outcomes for the upload-confirm step, and revisit local non-provider PDF extraction later if graceful degradation proves too common.

### D-20260311-40 - Student Chat Falls Back To The Deterministic Coach When Gemini Fails

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A4.4.1`, `A4.4.2`, `A4.4.3`, `A4.4.4`
- Context: The A4 smoke exposed intermittent Gemini failures on live coaching turns after the student message had already passed moderation and the conversation context was valid. Returning a hard `502` at that point made the core workbench feel broken even though the repo already contained the earlier deterministic coaching helper from `A3.4`.
- Decision: Keep the provider-backed coaching path as the primary route, but fall back to the deterministic draft-coach helper when the provider call fails. Preserve the same moderation and persistence flow around that fallback so the student still receives a structured next step instead of a route error.
- Why: This keeps the student workbench usable during provider instability, reuses an existing bounded fallback instead of inventing a second chat system, and preserves the current route/service architecture.
- Follow-up: Keep the smoke script reporting when deterministic coach fallback was used, and revisit provider retries or a second API provider later instead of making the student workflow depend on one flaky upstream call.

### D-20260311-41 - Phase A4 Closes On Stable Fallback-Backed Behavior Rather Than Perfect Provider Reliability

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A4.1.1`, `A4.1.2`, `A4.1.3`, `A4.2.1`, `A4.2.2`, `A4.2.3`, `A4.2.4`, `A4.3.1`, `A4.3.2`, `A4.3.3`, `A4.3.4`, `A4.4.1`, `A4.4.2`, `A4.4.3`, `A4.4.4`, `A4.5.1`, `A4.5.2`, `A4.5.3`, `A4.5.4`, `A7.2.2`
- Context: The latest student-flow smoke still exercised Gemini failure paths in extraction, coaching, and summary generation. Leaving `A4` open until those warnings disappeared would have conflated provider quality with product stability even though the implemented fallbacks now keep the full student workflow usable and verified end to end.
- Decision: Treat `A4` as complete once the student flow stays available through explicit fallbacks, the contracts are documented, and the smoke/verification passes are green. Track provider reliability as a QA and regression concern instead of a blocker on the phase itself.
- Why: The MVP needs bounded failure behavior more than upstream perfection. This closure rule keeps the roadmap aligned with the stable product contract actually delivered in code.
- Follow-up: Keep `scripts/smoke-student-flow.mjs` in the regression pass, confirm deployed env parity before demos, and revisit provider retries or a second backend provider later if fallback usage remains too frequent.

### D-20260311-42 - Phase A5 Uses Shared Adult Review Routes With Narrow Oversight Services

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A5.1.1`, `A5.1.2`, `A5.1.3`, `A5.2.1`, `A5.2.2`, `A5.2.3`, `A5.3.1`, `A5.3.2`, `A5.3.3`, `A5.3.4`, `A5.4.1`, `A5.4.2`, `A5.4.3`
- Context: Parent and tutor linkage already existed, but the protected app still only exposed placeholder adult dashboards. Adding one-off parent and tutor route trees would have duplicated the same conversation review contract, while leaving tutor notes as implicit table writes would have weakened traceability for the most sensitive adult-only surface in the MVP.
- Decision: Implement `A5` through shared adult review routes under `/app/students/[studentUserId]` and `/app/review/[conversationId]`, backed by narrow oversight services in `lib/server/oversight/`. Keep tutor-note writes behind canonical server routes, add explicit adult access revalidation plus audit rows on review reads, and expose a first admin queue at `/app/audit`.
- Why: This keeps the route tree compact, centralizes adult access checks, preserves the role-separated summary audiences already enforced by RLS, and makes tutor-note mutations auditable instead of hidden inside direct client writes.
- Follow-up: Expand the admin audit surface only when support or moderation workflows justify it, and keep richer billing management, quota enforcement, and note taxonomy in later phases instead of overloading `A5`.

### D-20260311-43 - Trial And Quota Decisions Share One Server-Owned Usage Snapshot

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A6.2.1`, `A6.2.2`, `A6.2.3`
- Context: `usage_counters` already existed, but the app still treated them as display-only. A6 needed real gating without letting the student dashboard, parent dashboard, and mutation routes drift into separate interpretations of "trial" or "quota reached."
- Decision: Resolve one server-owned usage snapshot per student inside `lib/server/usage/`, use that same snapshot for dashboard reads and mutation gates, count usage on conversation creation, upload-target creation, assistant replies, and provider token usage, and anchor quotas to the current calendar month. The MVP trial now starts on first recorded usage, lasts 30 days, and blocks new conversation, upload, or assistant-turn actions once either the trial window or the relevant quota budget is exhausted.
- Why: This keeps UI state and server enforcement aligned, avoids requiring a schema migration for first-pass usage tracking, and preserves student stability by gating only new expensive actions instead of retroactively breaking completed work.
- Follow-up: Recalibrate trial and paid quota numbers once real pilot usage data exists, and revisit a more atomic counter-write path if counter contention becomes visible in production telemetry.

### D-20260311-44 - MVP Billing Is Parent-Owned And Gracefully Disabled Until Lemon Checkout Config Exists

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A6.3.1`, `A6.3.2`, `A6.3.3`
- Context: The repo already reserved billing routes and the provider choice was settled, but the actual Lemon store and variant identifiers are still unset locally. The app still needed a real abstraction and webhook sync path without pretending checkout could succeed in an unconfigured environment.
- Decision: Implement billing through `lib/server/billing/`, keep the MVP payer role limited to `parent`, route checkout and portal actions through canonical server endpoints, and make those endpoints return an explicit `503` when Lemon checkout config is incomplete instead of failing opaquely. Subscription lifecycle state is now persisted only through the billing service and synced from signed Lemon webhooks, with a dedicated billing smoke covering both graceful checkout failure and webhook-driven persistence.
- Why: This preserves the thin-route architecture, keeps provider payload details out of route handlers and UI code, and gives the repo a verifiable subscription sync path even before the real Lemon checkout credentials are provisioned locally.
- Follow-up: Provision `LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_STORE_ID`, `LEMON_SQUEEZY_VARIANT_ID_FAMILY_MONTHLY`, and the webhook secret in Vercel and local `.env.local`, then replace the current config-failure branch with a real parent checkout round-trip smoke.

### D-20260311-45 - Privacy Controls Use One Settings Surface And Queue Deletion Before Purge

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A6.4.1`, `A6.4.2`, `A6.4.3`
- Context: The repo already had profile editing, parent billing, and the minors/privacy baseline, but there was no stable in-product place to explain retention rules, gate deletion-requested accounts, or let a parent request deletion for a linked child without bypassing audit and access checks.
- Decision: Implement privacy/data controls through a dedicated `/app/settings` route backed by `lib/server/privacy/`. Queue deletion by setting `users.account_status = deletion_requested` plus `deletion_requested_at`, sync auth metadata immediately, revoke tutor access immediately for linked-child deletion, redirect deletion-requested non-admin accounts back to `/app/settings`, and freeze new writes through explicit `requireActiveAppUser` checks in the relevant services. Keep the user-facing privacy copy, retention windows, and provider disclosures inside the same settings surface.
- Why: This keeps billing, profile, privacy copy, and deletion controls discoverable in one stable place, preserves explicit server-owned authorization for linked-child deletion, and gives the MVP a reversible queued-deletion contract instead of an opaque hard-delete button.
- Follow-up: Add the real purge worker or operator workflow that executes the queued deletion target once the 30-day window elapses, and keep `scripts/smoke-privacy-controls.mjs` in the regression pass.

### D-20260311-46 - Student Memory Stays Pedagogical, Audited, And Separate From Tutor Raw Access

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A6.1.1`, `A6.1.2`, `A6.1.3`, `A6.1.4`
- Context: The schema already reserved memory tables, but the product still had no canonical path for turning completed sessions into durable learning context, no safe manual correction flow, and no enforced boundary between useful parent visibility and raw tutor profiling. Without a logged decision, memory work risked drifting into ad hoc labels, duplicated client-side mutation logic, or tutor access that exceeded the privacy baseline.
- Decision: Implement memory through `lib/server/memory/` as one canonical domain. Refresh memory on conversation completion using a provider-backed `memory-profile-v1` prompt plus a deterministic fallback when the provider fails; persist only pedagogical categories centered on strengths, weaknesses, preferences, and recurring topics; expose raw memory through `GET` and `PATCH /api/students/[studentId]/memory`; allow manual edit and delete for the student, linked parent, and admin; audit parent and admin raw-memory reads; and deny tutor raw-memory access entirely so tutor surfaces continue to rely on derived summaries instead.
- Why: This keeps durable learning context useful for the next homework without turning memory into hidden profiling, aligns the feature with the minors/privacy baseline, and preserves student-flow stability by making memory refresh best-effort rather than another completion blocker.
- Follow-up: Keep `learning_note` reserved until a clearly-scoped use case exists, revisit retention windows after real pilot usage, and expand tutor-facing derived insights separately instead of weakening the raw-memory boundary.

### D-20260311-47 - Demo Readiness Uses One Written Checklist And One Aggregated Regression Command

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A0.4.2`, `A7.2.1`, `A7.2.3`
- Context: The repo already had several focused smoke scripts, but there was still no single acceptance document describing what "demo-ready" means across student, parent, tutor, admin, billing, privacy, and deployment checks. That left the project with automation but no stable operator runbook, and with no single command to rerun the current regression set before a demo or external walkthrough.
- Decision: Add `docs/smoke_checklist_v1.md` as the canonical acceptance checklist, covering automated and manual role-based smoke expectations, explicit blocking versus non-blocking outcomes, and the remaining device/deployment checks. Add `npm run regress:mvp` as the canonical pre-demo regression command that chains typecheck, lint, build, RLS verification, and the full current smoke suite.
- Why: This turns the existing smoke scripts into a repeatable release gate, reduces the chance of skipping an important cross-role check before demos, and makes later sessions inherit one stable definition of regression coverage instead of reconstructing it from scattered docs and package scripts.
- Follow-up: Record real iPad Safari results against this checklist as `A7.1` progresses, and tighten the regression command further if new high-risk flows are added later.

### D-20260311-48 - Cost Control Uses Bounded AI Context Plus Idempotent Artifact Reuse

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A7.3.1`, `A7.3.2`, `A7.3.3`
- Context: The MVP student path was stable, but repeated upload confirmation or completion could still risk duplicate Gemini work, and prompt size still scaled too directly with raw workspace, attachment, transcript, and translation text. The remaining `A7.3` question was how to lower cost without weakening the student contract or introducing a second hidden caching system.
- Decision: Centralize AI prompt-context truncation and output-token caps in `lib/server/ai/guardrails.ts`, enforce body-size caps before expensive student routes, and treat persisted extraction and completion artifacts as the primary cache layer. `POST /api/uploads/confirm` now reuses an already-resolved extraction result, and `POST /api/conversations/[conversationId]/complete` now reuses the stored student summary when the conversation is already completed. After reviewing upload economics against the current trial quotas, keep the existing `10 MB` image, `20 MB` PDF, `5` attachment, and `50 MB` per-conversation limits unchanged for the MVP.
- Why: This lowers provider spend with explicit, reviewable boundaries instead of adding a broad implicit cache, preserves stable student behavior, and keeps the storage contract aligned with the current trial model.
- Follow-up: Revisit `A7.3.2` with richer summary compaction or cross-request caching only if real production telemetry shows the current guardrails are still insufficient.

### D-20260311-49 - Launch Candidate Stays Web-First And Defers PWA Before Beta

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A7.4.1`, `A7.4.2`, `A7.4.3`
- Context: The product now has a real deployed web flow, a regression gate, and a founder-ready billing path in Lemon test mode, but the last meaningful manual risk is still real iPad Safari behavior. The repo also has no PWA manifest or service-worker foundation, so adding installability now would create a new branch of launch work without evidence that it matters more than device validation or demo operations.
- Decision: Freeze the launch candidate around the current web MVP, defer PWA installability until after beta, and treat `docs/founder_walkthrough_v1.md` plus `docs/launch_checklist_v1.md` as the canonical operating docs for demos and launch-readiness. Use the deterministic fixture accounts as the default role-demo set, while keeping real Lemon checkout demos on a separate fresh parent account instead of the seeded fixture parent.
- Why: This keeps the launch surface small, focuses attention on the flows that already exist and are regression-covered, and avoids spending launch time on installability plumbing before the web experience is fully validated on the target device.
- Follow-up: Revisit PWA only after `A7.1` closes on a real iPad Safari pass and early beta usage shows that installability would materially improve retention or return frequency.

### D-20260311-50 - Prompt-Level Traceability Is Experimental And Does Not Replace Session Logging

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A0.3.7`
- Context: The canonical session log preserves long multi-turn continuity well, but it is less useful for measuring one-prompt-at-a-time throughput, prompt handling duration, or remaining Codex credits across a dense working session.
- Decision: Keep [docs/work_sessions.md](work_sessions.md) as the mandatory canonical session log, and add [docs/work_prompt_log.md](work_prompt_log.md) as an experimental parallel trace with one row per handled user prompt. The prompt log records timestamps, duration, task IDs, scope, and a manual `Credits Left` column when the usage percentage is operator-visible.
- Why: This tests a finer-grained traceability method without breaking the existing session protocol or losing compatibility with the current operating rules.
- Follow-up: Compare the usefulness and maintenance cost of the prompt log after a few sessions before deciding whether it becomes permanent, optional, or retired.

### D-20260311-51 - Parent-Initiated AI Should Be Paid, While Passive Parent Oversight Stays In The MVP Baseline

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A7.3.4`
- Context: The current product already generates parent-facing value indirectly through the student completion flow, but it still has no direct parent-triggered AI route. Monetization pressure is real, yet changing the existing student completion contract just before MVP closure would create risk in the most stable cross-role slice.
- Decision: Publish `docs/ai_ops_economics_v1.md` as the canonical AI ops and economics note. Keep passive parent oversight in the MVP baseline, including stored parent summary variants when they already exist as a byproduct of student completion. Reserve any future parent-initiated AI action for the paid `Family` plan, such as on-demand summary regeneration, translation refresh, or parent-side coaching tools.
- Why: This keeps the current student-first contract stable, avoids weakening the free oversight story that helps parents evaluate the product, and creates a clear monetization boundary once adult-triggered AI actions are added.
- Follow-up: If parent-triggered AI routes are introduced after MVP, gate them explicitly through billing and usage services instead of relying on passive visibility rules or ad hoc UI hiding.

### D-20260311-52 - Gemini Stays Primary While OpenAI API Becomes The Explicit Fallback Provider Choice

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A0.2.4`
- Context: The MVP already ships against Gemini with stable fallbacks, but the original bootstrap task still left the fallback-provider choice undecided. That ambiguity was no longer useful: the provider boundary exists, billing and privacy assumptions are documented, and future reliability work needs one explicit fallback direction instead of an open-ended placeholder.
- Decision: Keep Gemini as the primary MVP provider and choose OpenAI API as the explicit fallback-provider target. Document the reserved fallback env in `docs/environment_matrix.md` and `.env.example`, but keep the fallback adapter disabled until it is intentionally implemented and provisioned.
- Why: This closes the architectural indecision without destabilizing the current Gemini-backed MVP slice, preserves a swappable provider boundary, and avoids pretending that a founder personal subscription is an acceptable backend fallback.
- Follow-up: If fallback reliability work becomes necessary after MVP, add the OpenAI adapter behind the existing AI provider interface and gate it through the documented env toggle instead of branching provider logic inside route handlers.

### D-20260311-53 - Frontend Foundation Work Uses Small Shared Primitives And Shared Locale Metadata Rather Than A Late Full UI-System Rewrite

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A2.1.3`, `A2.1.5`, `A2.1.6`
- Context: The app foundation tasks for component primitives, modularity guardrails, and localization structure were still open even though the product already had real role-based flows. A full design-system or full-copy rewrite at this stage would have added risk without improving MVP stability.
- Decision: Close the foundation gap with a narrow primitive layer under `components/ui/`, shared locale metadata under `lib/i18n/config.ts`, `.editorconfig` plus a small ESLint rule floor, and a written foundation contract in `docs/frontend_foundations_v1.md`. Apply the new primitives first to the highest-duplication forms and cards instead of forcing a repo-wide refactor.
- Why: This gives the codebase a stable shared foundation, removes duplicated locale option definitions, and improves reviewability without destabilizing the working student, parent, and tutor flows.
- Follow-up: Expand primitive adoption opportunistically in later slices instead of treating the MVP foundation task as a mandatory all-component migration.

### D-20260311-54 - MVP Telemetry Stays Whitelisted, Runtime-First, And Flag-Gated Until PostHog Exists

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A2.4.1`, `A2.4.2`, `A2.4.3`
- Context: The app already had runtime logging conventions and env placeholders for PostHog, but no actual telemetry route, no client event hook, and no explicit integration-toggle layer. At the same time, the minors/privacy baseline forbids broad or content-heavy analytics collection on student surfaces.
- Decision: Add a whitelisted telemetry route at `POST /api/telemetry/events`, a client route-view hook, and a shared `lib/feature-flags.ts` layer. Keep telemetry metadata-only, validate event names server-side, write the current MVP sink to structured runtime logs, and defer third-party forwarding until a real PostHog project exists. Reserve env toggles for analytics, OpenAI fallback, Resend-backed email, and future parent-initiated AI.
- Why: This closes the app-foundation telemetry task without leaking child content into analytics, keeps the contract reviewable, and gives risky integrations one explicit env-driven control surface.
- Follow-up: Once `A0.2.2` is complete, wire the telemetry service to PostHog through the same validated event boundary rather than bypassing it from client code.

### D-20260311-55 - GitHub Workflow Artifacts Are Source-Controlled Even When Remote Labels Remain Manual

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A0.3.6`
- Context: The repo already had a PR template, but the workflow task still lacked issue templates and any reviewable source of truth for labels. Remote label creation depends on authenticated GitHub settings access, which is not guaranteed in every session.
- Decision: Add source-controlled issue templates plus a canonical labels manifest under `.github/`, and document them in `docs/github_workflow_v1.md`. Keep the task itself open until the manifest is actually applied to the GitHub repository, because the in-repo artifacts alone do not create the labels remotely.
- Why: This preserves traceability and reviewability inside git while staying honest about the remaining external blocker.
- Follow-up: Apply `.github/labels.json` to the GitHub repository through the UI or an authenticated automation step, then close `A0.3.6`.

### D-20260311-56 - Tablet QA Uses A Repeatable Playwright Pre-Pass Without Replacing Real iPad Validation

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A7.1.1`, `A7.1.2`, `A7.1.3`
- Context: The remaining MVP blocker is real iPad Safari validation, but the first attempt to do ad hoc local tablet emulation during an active coding session caused instability and left no reviewable QA artifact behind. The project needed a lower-risk, repeatable pre-pass that could validate the current student surfaces on tablet-sized viewports before a manual device run.
- Decision: Add `scripts/smoke-tablet-emulation.mjs` as the canonical tablet-emulation pre-pass. The script now authenticates with the deterministic fixture student through the same SSR-cookie shape used by the other smoke scripts, starts a temporary `next start` instance from the current production build when no URL override is provided, checks `/app`, `/app/new`, and `/app/conversations/[conversationId]` in portrait and landscape tablet viewports, records screenshots, and reports horizontal-overflow plus tap-target findings. Keep real iPad Safari validation as a separate required step; this script does not close `A7.1` by itself.
- Why: This turns tablet QA into a reviewable repo artifact, reduces dependence on a running dev server or brittle UI-login timing, and lets future sessions catch layout and touch-target regressions before spending time on manual device testing.
- Follow-up: Log the real iPad Safari pass separately once upload, keyboard, and chat ergonomics are checked on hardware, and keep the tablet-emulation smoke focused on pre-pass layout and reachability rather than pretending to emulate Safari exactly.

### D-20260311-57 - The Canonical Regression Command Reseeds Fixtures Before Verification And Smokes

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A1.4.1`, `A1.4.3`, `A7.2.3`
- Context: `npm run regress:mvp` is documented as the canonical pre-demo regression pass, but the fixture-backed smoke scripts increment usage counters and other mutable state. Without a reseed inside the command, the regression suite becomes order-dependent and can fail on quota gates after earlier smoke runs even when the application code is unchanged.
- Decision: Update `npm run regress:mvp` so it runs `npm run seed:rls-fixtures` after the production build and before `verify:rls-fixtures` plus the smoke suite. Keep the individual smoke scripts restoring their own mutable fixture state where reasonable, but treat the seeded fixture reset as part of the canonical regression baseline.
- Why: The regression command should be deterministic from a dirty local fixture state, not only from a freshly reseeded manual session. Folding the reseed into the command keeps the documented acceptance gate honest and reduces hidden operator state.
- Follow-up: Keep the fixture seed destructive only for the known deterministic fixture rows and accounts, and revisit broader smoke isolation only if future scripts still leave non-fixture state behind.

### D-20260311-58 - Taiwan-First MVP Requires A Real Trilingual UI Pass, Not Locale Metadata Alone

- Date: 2026-03-11
- Status: accepted
- Related tasks: `A7.4.4`, `A7.4.5`, `A7.4.6`
- Context: `A2.1.6` established shared locale metadata and formatting helpers, but the current app still ships mostly hardcoded French UI copy, often with stripped accents, while the root layout still renders `lang="fr"` and the loaded fonts use Latin-only subsets. The founder also confirmed that the first real users are expected to be Taiwanese.
- Decision: Treat the existing locale foundation as necessary but not sufficient for launch. Add launch-blocking follow-up tasks for accented French cleanup, real interface-copy localization across `fr`, `en`, and `zh`, and zh-aware verification on the tablet-critical MVP routes. Keep this UI-language requirement separate from the AI-help language scope, which remains its own product and cost decision.
- Why: Persisting with metadata-only locale support would falsely imply the product is multilingual when the actual interface remains effectively French-only. Logging the follow-up keeps the MVP scope honest for the Taiwan-first pilot and prevents later sessions from mistaking saved language preference for real localized UX.
- Follow-up: Introduce route or surface-level UI dictionaries, wire the document language and font fallback intentionally, localize the highest-traffic shared surfaces first, and revisit Chinese AI-help support separately if pilot demand justifies it.

### D-20260312-59 - GitHub Label Sync Makes The In-Repo Manifest The Live Remote Baseline

- Date: 2026-03-12
- Status: accepted
- Related tasks: `A0.3.6`
- Context: `.github/labels.json` and the issue templates already existed, but the public repository still exposed only the default GitHub labels. That left the documented workflow half-real and made issue triage harder to trust.
- Decision: Use an authenticated GitHub CLI pass to sync the public repository labels from `.github/labels.json`, removing the default GitHub labels and leaving the manifest-defined set as the live remote baseline.
- Why: This closes the last external gap in the repo-owned GitHub workflow slice and keeps the label taxonomy reviewable in git rather than in ad hoc repository settings.
- Follow-up: Treat `.github/labels.json` as the source of truth and reapply it if labels drift or the repository is migrated.

### D-20260312-60 - Pilot Hardening Gets Its Own Backlog While MVP Keeps The Launch Gate

- Date: 2026-03-12
- Status: accepted
- Related tasks: `A7.4.8`
- Context: The MVP is close enough to launch-candidate status that the remaining work now splits into two different kinds: true launch blockers and broader pilot hardening around UI polish, UX smoothness, operating cadence, and release learning. Keeping all of that in one backlog would either hide launch blockers inside polish work or pressure the project to move unfinished blockers out of MVP too early.
- Decision: Add `docs/pilot_todo.md` as the dedicated hardening backlog for the first closed real-user rollout. Keep true launch blockers in `docs/mvp_todo.md` until they are closed, introduce `P*` task IDs for pilot hardening, and update `AGENTS.md` plus the session and prompt logs to accept either `A*` or `P*` task IDs depending on the work lane. Use `Pilot` as the recommended label for the next controlled release, and reserve `Beta` for a broader external rollout after pilot evidence justifies it.
- Why: This preserves an honest launch gate, gives polish and UX work a real audited home, and prevents future sessions from conflating controlled pilot learning with beta-scale readiness.
- Follow-up: Only graduate work from `docs/pilot_todo.md` into beta-readiness once the closed pilot produces concrete evidence on stability, user trust, and support load.

### D-20260312-61 - Trilingual MVP Copy Uses Shared Surface Dictionaries Plus Client-Side Document-Language Sync

- Date: 2026-03-12
- Status: accepted
- Related tasks: `A7.4.4`, `A7.4.5`, `A7.4.6`
- Context: The route layer had already started carrying `lang`, but the actual client surfaces for auth, onboarding, invite acceptance, app shell, and settings still contained hardcoded French strings. At the same time, Taiwan-first pilot readiness required real interface copy in `fr`, `en`, and `zh` without forcing a heavy i18n framework rewrite late in MVP.
- Decision: Keep the localization architecture intentionally narrow: shared locale metadata and age-band options stay in `lib/i18n/config.ts`, route or surface dictionaries live in `lib/i18n/ui-copy.ts`, public-route `lang` helpers live in `lib/i18n/ui-language.ts`, and the shared public/app shells render `components/i18n/document-language-sync.tsx` so the browser `lang` follows the active UI language after hydration. Apply this slice first to landing, pricing, auth, onboarding, invite acceptance, app shell, app-home account copy, and settings/privacy rather than attempting an all-dashboard translation in one pass.
- Why: This centralizes shared copy in reviewable files, keeps business logic out of translation helpers, preserves simple URL-driven language switching on public routes, and closes a meaningful part of the Taiwan-first interface gap without destabilizing the already-working role flows.
- Follow-up: Extend the same dictionaries or presenters into the deeper student, parent, tutor, and admin dashboard bodies, finish the broader accented-French and Unicode cleanup, and run a real tablet-focused `zh` fit check before closing `A7.4.6`.

### D-20260312-62 - Dashboard Localization Gets Its Own Copy Module Instead Of Growing `ui-copy.ts` Into A Catch-All

- Date: 2026-03-12
- Status: accepted
- Related tasks: `A7.4.4`, `A7.4.5`, `A7.4.6`
- Context: After the shared public/auth/settings localization pass, the next untranslated slice lived mostly inside the role dashboards on `/app`: student start/support/recent panels, the student memory panel, the student-side adult-link forms, and the parent/tutor/admin dashboard summaries. Folding that entire layer back into `lib/i18n/ui-copy.ts` would have turned one shared copy file into a mixed public-plus-dashboard catch-all.
- Decision: Add `lib/i18n/dashboard-copy.ts` as the dashboard-specific dictionary module. Keep the previous shared-shell/public/auth/settings content in `lib/i18n/ui-copy.ts`, move dashboard-only copy and localized dashboard labels into the new module, and let `components/dashboard/student/student-dashboard-presenters.ts` delegate its localized labels to that layer.
- Why: This keeps the i18n structure reviewable, prevents the shared copy layer from becoming a god file, and gives the `/app` route family a focused place to keep evolving while the remaining intake, history, detail, review, and workbench surfaces are translated later.
- Follow-up: Reuse the same dashboard-copy layer for linked-student detail, read-only review, and other dashboard-adjacent surfaces as the remaining MVP translation pass continues.

### D-20260312-63 - Student Session Routes And Adult Oversight Detail Routes Get Their Own Copy Modules

- Date: 2026-03-12
- Status: accepted
- Related tasks: `A7.4.4`, `A7.4.5`, `A7.4.6`
- Context: After the shared-shell pass and the `/app` dashboard pass, the remaining untranslated MVP surfaces were no longer one coherent layer. `/app/new`, `/app/history`, `/app/conversations/[conversationId]`, `/app/students/[studentUserId]`, and `/app/review/[conversationId]` mixed intake wording, workbench controls, read-only oversight copy, and localized fallback messages. Extending `lib/i18n/dashboard-copy.ts` again would have blurred dashboard concerns with session and oversight route concerns.
- Decision: Add `lib/i18n/student-flow-copy.ts` for intake, history, workbench, summary-panel, attachment, and client-upload copy, and add `lib/i18n/oversight-copy.ts` for linked-student detail, adult review, tutor notes, tutor summary, and billing-status copy. Keep the route components presentational by passing `languageCode` down and resolving strings in those focused copy modules instead of reintroducing inline French.
- Why: This preserves a reviewable i18n structure, removes visible internal or dev phrasing from the deeper MVP routes, and localizes the remaining high-traffic student and adult surfaces without turning one copy file into a second hidden application.
- Follow-up: Finish the remaining accented-French and Unicode audit, keep narrowing any residual generic provider or service fallback strings, and complete the parent-summary default plus broader real-device language-switch verification before calling the trilingual launch pass done.

### D-20260312-64 - Gemini Free-Tier Project Limits Stay Development-Only While Pilot Uses A Dedicated Billed Project

- Date: 2026-03-12
- Status: accepted
- Related tasks: `A0.2.4`, `A7.3.4`, `A7.4.3`
- Context: The current founder setup hit Gemini free-tier RPM and RPD limits during local work. Google documents those limits as project-level rather than key-level, with the daily window resetting at midnight Pacific. That means the repo cannot treat "one more API key" inside the same project as a real mitigation path, and it should not assume that the local free-tier project is an acceptable live pilot backend.
- Decision: Treat the current free-tier Gemini project as development-only. For the first real pilot, provision a separate billed Gemini project, mirror only that project's key into the pilot or production environment, and keep dev work on a separate project so UI iteration cannot starve real user traffic. Document this in the AI ops note, environment matrix, and launch checklist instead of leaving it as oral knowledge.
- Why: This turns a fragile founder-memory detail into an explicit operating rule, makes launch-readiness criteria more honest, and avoids a false sense of resilience based on API-key rotation that would not actually bypass project-level rate windows.
- Follow-up: Add a dev-only mock-AI mode plus any needed 429 backoff or telemetry refinements in the pilot lane so local UI work burns less real provider quota.

### D-20260312-65 - The Trilingual MVP Pass Now Covers Admin Audit, Deletion Feedback, And Quota Errors

- Date: 2026-03-12
- Status: accepted
- Related tasks: `A7.1.2`, `A7.4.4`, `A7.4.5`, `A7.4.6`
- Context: After the deeper route localization pass, the user-facing language leaks that still mattered on shared MVP surfaces were no longer whole pages. They were concentrated in the admin audit list, the privacy deletion form and blocked reasons, the quota-block messages surfaced during conversation or upload actions, and the tablet-emulation smoke script still depended on pre-accent French selectors. The root font setup also still relied on Latin-first fonts without an explicit CJK fallback chain.
- Decision: Extend the existing focused i18n architecture rather than introducing a new framework. Keep admin audit copy and label mappings in `lib/i18n/oversight-copy.ts`, keep deletion-request form feedback in `lib/i18n/ui-copy.ts`, localize the privacy blocked reasons and quota-block `AppError` messages from the viewer's `preferred_ui_language`, add explicit CJK fallback fonts in `app/layout.tsx`, and refresh `scripts/smoke-tablet-emulation.mjs` to the current accented French selectors before rerunning the local tablet smoke.
- Why: This closes the remaining high-visibility language leaks on MVP-critical routes, keeps copy close to the surfaces that own it, and preserves the existing narrow localization structure instead of widening scope into a late global refactor.
- Follow-up: The remaining launch-blocking language work is now mostly the broader accented-French and Unicode audit, the broader parent-summary and language-switch verification, and the still-pending real iPad verification.

### D-20260312-66 - Tablet Emulation Smoke Can Temporarily Flip The Fixture UI Language

- Date: 2026-03-12
- Status: accepted
- Related tasks: `A7.1.2`, `A7.4.6`
- Context: The original tablet-emulation smoke only exercised the seeded French fixture account, so once the trilingual UI pass advanced, the repeatable pre-pass could not say anything about `zh` fit without a manual profile edit before every run.
- Decision: Extend `scripts/smoke-tablet-emulation.mjs` with `SMOKE_UI_LANGUAGE=fr|en|zh`. The script now temporarily updates the fixture student's `preferred_ui_language`, runs the localized selector plan for that language, and restores the seeded fixture language afterward.
- Why: This keeps the tablet pre-pass repeatable, reduces manual fixture drift, and gives the MVP a real local `zh` route-fit check on the critical student surfaces before the later hardware pass.
- Follow-up: Keep treating the localized smoke as a pre-pass only. Real iPad Safari behavior, broader language-switch verification, and parent-summary default checks still remain outside what this script proves.

### D-20260312-67 - Core Student Runtime Text Reuses The Student-Flow Copy Boundary

- Date: 2026-03-12
- Status: accepted
- Related tasks: `A7.1.2`, `A7.4.4`, `A7.4.5`, `A7.4.6`
- Context: After the interface-copy pass, the biggest remaining language leaks on MVP-critical student routes were no longer static labels. They were the server-owned validation errors coming back from `/api/conversations` and `/api/uploads`, the deterministic transcript scaffolding created at intake time, the moderation-safe and provider-fallback coach replies, the deterministic student-summary fallback, and the raw weakness-tag codes rendered in student and tutor summary chips.
- Decision: Keep those runtime strings inside the existing student-flow localization boundary instead of introducing a new global server-i18n layer. `lib/i18n/student-flow-copy.ts` now owns the user-facing conversation and upload validation messages, initial draft transcript labels, localized extraction warnings, deterministic coach fallback copy, deterministic student-summary fallback copy, and weakness-tag labels. The route handlers pass `preferred_ui_language` into student-facing request parsers, while deterministic coaching and required student-summary fallback continue to follow `ai_help_language`.
- Why: This closes the highest-traffic remaining language leaks without adding another abstraction layer, preserves the narrow surface-oriented i18n structure, and keeps the student runtime behavior aligned with the route and summary surfaces that already depend on the same copy module.
- Follow-up: The remaining launch-blocking language work is now mostly the accented-French and Unicode audit, parent-summary default and language-switch verification, and residual generic provider or service fallback strings that still bypass the focused copy modules.

### D-20260312-68 - Shared Light Or Dark Theme Lives In One Shell-Level System

- Date: 2026-03-12
- Status: accepted
- Related tasks: `P1.1`, `P1.2`, `P1.3`
- Context: The MVP already had a calmer light-shell baseline, but it still behaved like a single-theme app. There was no real dark theme model, no persisted user preference, and too many shared surfaces still depended on literal white backgrounds. The pilot lane also needed a faster way to iterate on trust and polish without redesigning each page in isolation.
- Decision: Keep theme work at the shared-shell and primitive layer. `app/globals.css` now owns the dual light or dark token system, `components/theme/theme-script.tsx` bootstraps the theme before hydration, `components/theme/theme-toggle.tsx` exposes the toggle in both public and authenticated shells, `lib/theme/config.ts` holds the shared theme constants, and the shared buttons, inputs, cards, auth surfaces, and shell chrome now resolve through those tokens. The visual direction intentionally blends ChatGPT-like calm workspace restraint with Brainly-like blue or warm educational accents instead of copying either product literally.
- Why: This creates one reviewable theme system for both shells, keeps route components from growing their own dark-mode forks, and raises perceived product polish on the highest-traffic surfaces with a bounded change set rather than a full route-by-route redesign.
- Follow-up: Keep `P1` open for deeper route-level cleanup, empty/loading/error consistency, and future accessibility or contrast review on real pilot devices.

### D-20260312-69 - Pilot Backlog And Git Publishing Become Mandatory Same-Session Close-Out

- Date: 2026-03-12
- Status: accepted
- Related tasks: `A0.3.2`, `A0.3.6`, `A0.3.7`, `P4.1`, `P4.2`
- Context: The repo now has a real `docs/pilot_todo.md` lane, but recent hardening work showed an avoidable failure mode: pilot-relevant status can change in code and docs without the pilot backlog being updated in the same session, and verified work can remain only in a local dirty worktree instead of becoming durable git history. Both gaps weaken handoff quality even when the underlying implementation is correct.
- Decision: Treat `docs/pilot_todo.md` as mandatory maintenance whenever a session changes pilot-facing polish, UX findings, release-ops assumptions, or `P*` task status, even if the active implementation still lives under an `A*` launch task. Also treat a task-ID git commit plus push to `origin` as the default end-of-slice workflow after verification. If a push should be deferred, the reason must be stated explicitly in the session close-out instead of left implicit.
- Why: This keeps pilot readiness reviewable from the repo itself rather than from chat memory, and it turns git history into part of the operating trace instead of an optional afterthought.
- Follow-up: Apply the rule immediately on the next coherent slice, and keep commits bounded when the local worktree contains unrelated in-flight changes.

### D-20260312-70 - The Final MVP Language-Leak Slice Reuses Focused Surface Copy Modules

- Date: 2026-03-12
- Status: accepted
- Related tasks: `A7.4.4`, `A7.4.5`, `A7.4.6`
- Context: After the shared dashboard, student-flow, deletion, quota, and admin-audit localization passes, the highest-visibility remaining self-serve language leaks were concentrated in auth/profile bootstrap and update, invitation create and accept, tutor-note mutations, memory mutations, a small parent billing-management conflict path, and the accentless deterministic memory fallback copy.
- Decision: Close that slice by extending the existing focused copy modules instead of introducing a new global server-i18n layer. `lib/i18n/ui-copy.ts` now owns auth/profile and invitation server-copy helpers, `lib/i18n/dashboard-copy.ts` owns memory server-copy helpers plus deterministic memory fallback text, and `lib/i18n/oversight-copy.ts` owns tutor-note and billing-management server-copy helpers. The affected routes and services now thread `preferred_ui_language` into their parsers and user-facing error branches.
- Why: This closes the visible launch-blocking leaks with a bounded change set, keeps the i18n architecture narrow and reviewable, and avoids turning generic server-error handling into a second translation framework before the MVP launch gate.
- Follow-up: Finish the broader accented-French and Unicode audit, keep narrowing any residual generic provider or service fallback strings, and complete the remaining parent-summary default plus real-device language-switch verification.

### D-20260312-71 - The Public Landing Stops Acting Like A Toolbox

- Date: 2026-03-12
- Status: accepted
- Related tasks: `A7.4.7`, `P1.1`, `P1.2`, `P1.3`
- Context: The previous `/` page still behaved like an operator toolbox. It exposed too many direct shortcuts at once, mixed product framing with repo links, and made the public entry feel closer to an internal project hub than to a calm parent- or student-facing product page.
- Decision: Keep the shared public shell, but reshape `/` into a concise product landing with one clear hero, a short flow explanation, role framing, and a quieter closing CTA. Move the old quick-access shortcuts into a floating helper button positioned above the Vercel helper area, and simplify the shared public theme control to a single light-or-dark icon toggle instead of a labeled segmented control.
- Why: This preserves fast operator access without making the public page feel like a dev console, keeps the most visible entry route aligned with the current trust-oriented visual direction, and reduces cognitive noise for first-time visitors.
- Follow-up: Iterate on the landing copy after user review, audit the same calmness standard on the pricing and auth pages, and validate the helper-button placement against the real deployed Vercel helper plus real tablet hardware.

### D-20260312-72 - The Home Route Now Owns A Story-First Product Narrative

- Date: 2026-03-12
- Status: accepted
- Related tasks: `A7.4.7`, `P1.1`, `P1.2`, `P1.3`
- Context: The first landing redesign was calmer, but it still relied too much on generic shell cards and inherited footer structure. The next requested iteration needed a clearer public story: a large English-first hero, a single free-signup CTA, one heavy feature section, two alternating preview sections, and less chrome competing with the message.
- Decision: Keep the shared public shell for header, language, and auth entry, but let `/` own its full narrative structure and hide the heavier shared footer there. The public header now reduces to logo plus utility controls, the language switcher is a globe-menu dropdown, the floating helper also carries the pilot context, and the landing body now uses preview placeholders that can be replaced later by real product GIFs without another structural rewrite.
- Why: This makes the home route feel intentionally product-facing instead of shell-driven, keeps the CTA hierarchy obvious, and future-proofs the page for real media assets and later copy iteration.
- Follow-up: Replace the preview placeholders with real product captures or GIFs, refine the English source copy after review, keep `fr` and `zh` aligned as the text evolves, and verify the new utility cluster against the real deployed helper stack and tablet interactions.

### D-20260312-73 - Shared Themes Expand Into Previewable Presets And Saved Custom Tokens

- Date: 2026-03-12
- Status: accepted
- Related tasks: `A7.4.7`, `P1.1`, `P1.2`, `P1.3`
- Context: The shared shell already had a binary light-or-dark model, but the landing iteration now needs faster visual exploration without repeated code edits. A simple toggle was no longer enough for comparing calmer, warmer, or more neutral directions, and the founder explicitly wants a path to save a custom variant from the UI itself.
- Decision: Expand the shared theme system from two modes into five: `light`, an inferred ChatGPT-like `dark`, the previous dark palette renamed to `smooth`, a warmer `warm` preset, and `custom`, which starts from `smooth` and overlays saved global CSS variables. Keep the quick icon toggle in the shared shells, but expose the full preview-on-hover theme menu plus custom-token editor in the landing floater. Persist the selected theme and custom token record in local storage, and let the bootstrap script restore them before hydration.
- Why: This keeps theme experimentation inside the shared token architecture, enables rapid visual iteration without reopening core CSS each time, and preserves one durable theme path for both public and authenticated surfaces instead of spawning ad hoc page-specific variants.
- Follow-up: Run tablet smoke again against the new presets, decide whether custom themes should later become account-level settings instead of device-local preferences, and tighten the custom-token set if some variables prove unnecessary in real iteration.

### D-20260312-74 - The Landing Canvas Widens While Narrative Rows Standardize

- Date: 2026-03-12
- Status: accepted
- Related tasks: `A7.4.7`, `P1.1`, `P1.2`, `P1.3`
- Context: The calmer landing rewrite was structurally better, but the first row still felt boxed in, the lower sections mixed prose and previews inconsistently, and the utility controls still had small polish defects such as a clipped globe icon and a theme submenu that opened below the floater instead of beside it.
- Decision: Keep the story-first landing, but widen the page canvas, center the hero and closing CTA, remove the outer wrapper panels around the preview rows, and standardize the body into three alternating `1 preview + 3 glass cards` sections. Replace the old text-heavy preview blocks with locally hosted neutral abstract GIF placeholders from public sources inside `public/landing/`, and tighten the utility interactions by forcing the theme submenu to open to the left of the floater and correcting the language-button icon geometry.
- Why: This preserves readability for the text while giving future product media more horizontal room, makes the repeated sections feel intentional instead of ad hoc, and removes two visible UI rough edges from the highest-traffic public controls.
- Follow-up: Replace the placeholder GIFs with real captured product media, validate the widened layout against the deployed site on large monitors, and keep checking the compact utility controls against tablet and touch-device behavior.

### D-20260312-75 - Public Shell Chrome Simplifies While Shared CTA Motion Stays Global

- Date: 2026-03-12
- Status: accepted
- Related tasks: `A0.3.7`, `A7.4.7`, `P1.1`, `P1.2`, `P1.3`
- Context: The landing still carried a little too much header chrome, the media rows needed a stricter same-size rhythm, and the CTA emphasis needed more life without introducing loud page-local animation.
- Decision: Remove the subtitle from the public-shell wordmark, widen the public header rail to match the broader landing canvas, lock the three landing GIF rows to the same height, and move the CTA motion into the shared `button-primary` token layer as a slow background-position drift with reduced-motion fallback.
- Why: This makes the header feel less like a product brochure masthead, keeps the story rows visually disciplined, and adds a small amount of energy without scattering bespoke animation logic across routes.
- Follow-up: Reassess whether the shared CTA drift should remain global once more authenticated app surfaces are visually tuned, and decide later whether any pointer-following background effect belongs on the landing at all or should remain a pilot-only experiment.

### D-20260312-76 - Subject Handling Stays Flat In MVP While Adult Verification Remains Operational

- Date: 2026-03-12
- Status: accepted
- Related tasks: `P2.4`, `P4.5`
- Context: The current repo already stores `subject_tag`, exposes recent-subject rollups, and allows a custom subject through the intake flow, but the founder asked whether subject-specific conversation modes, subject-shaped memory, and adult verification for parent accounts were already designed in a stronger way.
- Decision: Keep the MVP subject model intentionally flat for now: one shared coaching workflow, one subject tag per conversation, custom subjects allowed through the existing `Other subject` intake path, and no subject-family-specific prompt or memory forks yet. Also treat parent adulthood verification as an operational pilot question rather than a solved product mechanism: the current system knows roles and links, not real-world age or guardianship.
- Why: This matches the implemented product reality, avoids inventing fake subject specialization late in MVP, and keeps a real compliance or trust gap visible instead of pretending role selection proves adulthood.
- Follow-up: Use `P2.4` to decide which subject families need distinct coaching modes or normalization, and use `P4.5` to define whether pilot parent trust comes from founder review, payment-method ownership, support verification, or a stronger later verification layer.

### D-20260313-77 - Dropdown And Popover Work Must Name The Clipping Ancestor First

- Date: 2026-03-13
- Status: accepted
- Related tasks: `A0.3.7`
- Context: Repeated public-shell dropdown fixes showed a predictable failure mode in agent-driven UI work: when a menu is clipped, the first patch often targets the child component with `z-index`, placement, or timing tweaks instead of identifying the parent container and the computed rule that actually clips it.
- Decision: Make clipping analysis an explicit repo workflow rule. Future dropdown, popover, and hover-menu work must identify the clipping ancestor and the exact computed `overflow` or stacking-context rule before changing child geometry. If the menu must escape its container, the implementation should choose between a portal and an explicit overflow-allowing shell variant rather than retrying child-only fixes.
- Why: This reduces repeated shallow UI debugging, makes the root cause reviewable in code review, and turns a recurring chat lesson into durable operating guidance.
- Follow-up: Keep the high-level rule in `AGENTS.md`, keep the implementation-facing version in `docs/frontend_foundations_v1.md`, and prefer reusable primitives or patterns when more menus are added later.

### D-20260313-78 - The Auth Route Prioritizes A Viewport-Fit Entry Over Repeated Shell Narrative

- Date: 2026-03-13
- Status: accepted
- Related tasks: `A7.4.7`, `P1.1`, `P1.3`
- Context: The shared public shell and early auth panel were calm, but the route still relied on a repeated footer section, a stacked marketing rail on small screens, and taller implementation-oriented copy. That combination made `/auth` scroll when it should behave like a focused entry screen.
- Decision: Let `/auth` opt out of the shared public footer, constrain the route to the dynamic viewport height, keep the heavier informational rail to desktop widths, surface a shorter intro inside the main card on smaller screens, and center the segmented `Sign in` or `New user` switch. Also shorten the shared auth-copy strings so the route carries only the minimum orientation needed before the user acts.
- Why: This keeps the auth page closer to a proper product entry surface, reduces unnecessary scroll pressure, and preserves the clearer public narrative for the landing page instead of repeating it below the auth form.
- Follow-up: Validate the viewport-fit behavior on real mobile browsers during the pilot device pass, and only re-expand auth copy if a concrete onboarding-comprehension problem appears in testing.

### D-20260313-79 - Public-Facing Placeholder Copy Is The Default For MVP And Pilot UI Iteration

- Date: 2026-03-13
- Status: accepted
- Related tasks: `A0.3.7`, `A7.4.7`, `P1.1`, `P1.3`
- Context: Recent auth and landing iterations showed that placeholder or in-progress UI text can easily drift into implementation-facing wording, even when the route is already user-visible and the founder expects suggestion-quality public copy by default.
- Decision: Treat public-facing suggestion copy as the default whenever placeholder UI is refreshed on MVP or Pilot routes. Internal or implementation-facing wording should only remain on clearly operator-only surfaces or when the user explicitly asks for temporary dev copy. The rule now lives in both `AGENTS.md` and `docs/frontend_foundations_v1.md`.
- Why: This keeps visible routes closer to the intended product tone during iteration, reduces rework on copy that has to be public again a few prompts later, and prevents user-facing surfaces from feeling like scaffolding.
- Follow-up: Keep `fr`, `en`, and `zh` aligned whenever public placeholder copy changes, and revisit the wording again once real product copy is finalized.

### D-20260313-80 - The Auth Header Splits Into A Minimal HUD Variant

- Date: 2026-03-13
- Status: accepted
- Related tasks: `A7.4.7`, `P1.1`, `P1.3`
- Context: Even after the auth footer was removed, the shared public header still consumed more vertical space and visual weight than the auth route needed. The route should read like a compact entry screen, not like the landing page with one more form below it.
- Decision: Add a compact `hud` header variant to `PublicShell`, let `/auth` use it without the extra auth CTA, and expose minimal icon-only `ThemeToggle` and `LanguageMenu` variants to match the lighter chrome. The auth cards themselves no longer stretch to fill the viewport height, so the route stays centered and smaller.
- Why: This preserves the shared shell and controls while giving `/auth` a more appropriate density and hierarchy, and it fixes the oversized-card feel by removing forced full-height stretching.
- Follow-up: Reuse the HUD variant only where a route genuinely benefits from tighter chrome, and keep validating the menu behavior against the overflow rules recorded in `D-20260313-77`.

### D-20260313-81 - Auth Defaults To One Centered Card Unless More Explanation Is Proven Necessary

- Date: 2026-03-13
- Status: accepted
- Related tasks: `A7.4.7`, `P1.1`, `P1.3`
- Context: The first compact `/auth` pass still preserved a separate left information rail on larger screens. That kept the page visually heavier than needed and reintroduced explanatory chrome on a route that is primarily about quick entry, not marketing.
- Decision: Remove the default left auth rail and keep `/auth` as one centered card. The route now carries only a short public-facing headline, one supporting sentence, and compact orientation chips inside the main card. Additional explanatory content should only return if real testing shows that users do not understand the role flow without it.
- Why: This makes the route calmer, shorter, and more obvious, and it avoids preserving a second panel just because there is desktop width available.
- Follow-up: Validate the simplified single-card auth route in real user walkthroughs, and only add more explanation back with a concrete evidence note.

### D-20260313-82 - The Auth Toggle Becomes The First Visible Content

- Date: 2026-03-13
- Status: accepted
- Related tasks: `A7.4.7`, `P1.1`, `P1.3`
- Context: Even the reduced single-card auth route still carried headline, body, and chip content above the segmented toggle. That kept visual noise on a screen whose main job is immediate entry.
- Decision: Remove all content above the `Sign in` or `New user` toggle so the segmented control is the first visible block inside the auth card. Keep only the stateful callouts, form fields, and footer note below it.
- Why: This makes `/auth` faster to parse and matches the current product goal of a minimal entry surface rather than a narrative page.
- Follow-up: If the product later needs orientation again, add it back only with evidence and place it in the smallest form that preserves the toggle-first hierarchy.

### D-20260313-83 - Visible Routes Should Read Like Product Surfaces, Not Build Scaffolding

- Date: 2026-03-13
- Status: accepted
- Related tasks: `A7.4.7`, `P1.1`, `P1.3`
- Context: Even after the earlier placeholder-copy rule was added, several visible routes still used implementation-facing language such as `Pricing shell`, API-path references, canonical-route notes, future-media caveats, and scaffold-style explanations on onboarding and student surfaces.
- Decision: Run a focused copy cleanup across the shared dictionaries that back public and high-traffic app routes. Pricing, onboarding, auth-complete, app-home, landing helper text, and the shared student start/history/workbench surfaces now use product-facing language by default. Internal error envelopes and truly operator-only surfaces can still keep technical wording when needed.
- Why: User-visible routes should preserve trust and coherence even while the product is still being iterated. Removing scaffold language closes one of the most obvious remaining “unfinished build” signals.
- Follow-up: Keep revisiting copy quality during Pilot, but treat future copy work as refinement rather than basic placeholder removal. If technical wording remains on a user-visible route, log it as an explicit exception or clean it in the same slice.

### D-20260313-84 - User-Facing Theme Choice Is Hidden Again While The Shared Theme Layer Follows The System

- Date: 2026-03-13
- Status: accepted
- Related tasks: `A7.4.7`, `P1.1`, `P1.3`
- Context: The shared multi-theme work was useful for rapid visual iteration, but visible theme controls and stored local overrides added settings noise back into MVP routes that are still converging on one calmer public presentation. At the same time, the authenticated shell still leaked pilot framing through a badge, a literal `/app/new` route hint, and admin copy that described itself as an incomplete scaffold.
- Decision: Keep the shared theme-token architecture, but make the live MVP experience follow the operating-system light or dark preference by default and remove user-facing theme controls from the public shell, authenticated shell, and landing floater. Clear older stored theme overrides during bootstrap so hidden legacy choices do not linger. In the same slice, remove the pilot badge from the authenticated shell, replace the student start panel's literal route hint with product-facing action guidance, and rewrite the admin dashboard copy so it describes the actual trust and audit surface instead of an in-progress step.
- Why: This restores a quieter default experience, reduces configuration chrome on first-use routes, and makes `/app` feel more like a product workspace than a pilot console without throwing away the shared theme foundation underneath.
- Follow-up: If explicit theme selection returns later, reintroduce it as a deliberate pilot experiment or account-level setting rather than as always-visible shell chrome. Keep auditing authenticated surfaces for any remaining implementation-facing wording as the product copy matures.

### D-20260318-85 - The French Accent Audit Extends Into The Prompt Layer, Not Just Visible UI Copy

- Date: 2026-03-18
- Status: accepted
- Related tasks: `A7.4.4`
- Context: The visible shared UI had already been cleaned up substantially, and `app/layout.tsx` already carried `latin-ext` plus explicit CJK fallback. The most meaningful remaining French degradation was in the AI prompt layer: coach, summary, translation, and memory prompts still used accentless French such as `francais`, `resume`, `eleve`, and `reponds`, which risked lowering the quality and credibility of generated French outputs even after the UI itself improved.
- Decision: Treat the accent audit as covering both visible shared MVP surfaces and the French prompt layer that directly shapes user-facing generated text. Restore proper accented French in `lib/server/ai/prompts/`, switch the prompt language labels to real Unicode values such as `français`, and bump the affected prompt versions to `v2` so generated summaries, translations, coach replies, and memory items remain traceable after the wording cleanup.
- Why: French quality in this product is not only a UI-copy problem. The AI prompt text is part of the user-facing language surface because it determines the tone and correctness of the generated summaries and replies shown to students and adults.
- Follow-up: Keep `A7.4.5` and `A7.4.6` focused on the remaining route-level localization gaps, parent-summary default behavior, language-switch verification, and residual generic provider or service strings that still bypass the shared copy modules.

### D-20260318-86 - Bring Back Only The Simple Light-Or-Dark Toggle In Shared Shell Chrome

- Date: 2026-03-18
- Status: accepted
- Related tasks: `A7.4.7`, `P1.1`, `P1.3`
- Context: The earlier decision to hide theme controls entirely reduced chrome, but it also removed a familiar and low-confusion affordance from both the public header and the authenticated shell. The broader preset/custom theme system was the real source of dev-only complexity, not the single light-or-dark toggle itself. The founder specifically wants the `/app` parent work to reuse the public hero-toolbar utility pattern for language and theme without reopening the old theme lab.
- Decision: Restore only the simple light-or-dark `ThemeToggle` in shared shell chrome, keep the public `LanguageMenu`, and add the same compact utility cluster to the authenticated header through a dedicated `components/layout/app-toolbar-controls.tsx` helper. Re-enable stored theme preference only for `light` or `dark`, while keeping unsupported legacy theme values and the old preset/custom menu path hidden from MVP users.
- Why: This preserves a familiar, low-noise control that users already understand, aligns the public and authenticated headers visually, and avoids reintroducing the more confusing dev-style preset/custom theme system.
- Follow-up: Keep the utility cluster compact, validate it against the parent dashboard work now starting, and only revisit richer theme controls if the pilot produces a real reason to expose more than light-or-dark again.

### D-20260318-87 - The Authenticated Language Menu Must Write Profile State, Not Public-Route Query State

- Date: 2026-03-18
- Status: accepted
- Related tasks: `A7.4.7`, `P1.3`
- Context: After the shared toolbar controls were added to `/app`, the language menu looked wired but was effectively broken. The public menu works by rewriting `?lang=` on routes that already resolve copy from the URL, but authenticated app surfaces resolve copy from `appUser.preferred_ui_language`. Reusing the public menu there only changed the URL and left the real UI language unchanged. The authenticated header also clipped the dropdown because it lacked the explicit overflow-allowing shell variant already used on the public header.
- Decision: Keep the public `LanguageMenu` behavior for public routes, but introduce a dedicated authenticated `AppLanguageMenu` that patches `/api/auth/profile` with the next `preferred_ui_language`, then refreshes the current route. Also mark the authenticated header with `shell-panel--allow-overflow` so the dropdown can escape the shell correctly.
- Why: Public and authenticated routes do not derive UI language from the same source of truth. Treating them as identical creates a control that appears interactive while failing to change the actual app state.
- Follow-up: Reuse this rule for any future authenticated language controls: if the view is profile-driven, mutate profile state; if the view is URL-driven, mutate the URL. Do not conflate the two paths again.

### D-20260318-88 - Authenticated Language Switching Should Refresh Immediately, Then Persist

- Date: 2026-03-18
- Status: accepted
- Related tasks: `A7.4.6`, `P1.3`
- Context: After the authenticated language menu was wired correctly, the founder still observed an unusual multi-second delay before `/app` visibly changed language. The root cause was not only the menu state. The authenticated control waited for `PATCH /api/auth/profile` to finish before it even started `router.refresh()`, and parent or tutor dashboards can take noticeable time to re-render because they reload linked students, conversations, summaries, usage, and billing snapshots server-side.
- Decision: Treat authenticated language switching as a two-step path. `AppLanguageMenu` now applies an optimistic local selection, writes a short-lived `ia_ui_lang` cookie override before the refresh request starts, and only then starts `router.refresh()` immediately. Authenticated page context in `lib/server/auth/page-guards.ts` now honors that cookie over `appUser.preferred_ui_language` while rendering `/app`, so visible server-rendered copy can switch during the refresh even before the slower profile PATCH completes. The saved profile update still runs in the background and falls back cleanly if it fails. Also treat dropdown clipping as an ancestor-level constraint: when the authenticated shell header hosts hover menus, every clipping ancestor on that header must opt into overflow, not just `shell-panel`.
- Why: The user expectation for a language toggle is immediate visible feedback. Starting the route refresh only after the write completed made the control feel broken on heavier authenticated dashboards even when the mutation itself succeeded.
- Follow-up: Keep `A7.4.6` open until the rest of the end-to-end language-switch verification is complete, especially parent-summary default behavior and real tablet or iPad checks. If more profile-driven preferences later need the same feel, reuse this pattern deliberately instead of waiting on the write path first.

### D-20260318-89 - The Parent Dashboard Owns Its Own `/app` Information Architecture

- Date: 2026-03-18
- Status: accepted
- Related tasks: `P1.1`, `P1.3`, `P2.2`
- Context: The earlier parent `/app` surface inherited too much of the generic authenticated shell rhythm. It mixed linked learners, blocked-student status, recent activity, weekly summary, and a separate bottom account-settings block without a strong parent-first hierarchy. It also kept explanatory or implementation-facing text that made the route feel like a placeholder console instead of a trustworthy parent workspace.
- Decision: Restructure the parent dashboard from first principles around the actual parent job. The generic desktop shell sidebar is suppressed for the parent role, and the dashboard now owns a dedicated left rail with a parent account or billing dock plus linked-learner cards. The main column groups cross-learner weekly rhythm and recent sessions into one activity hub, and surfaces one spotlight learner as the clearest next follow-up when the data supports it. The old blocked-student section and the separate bottom account-settings block are removed from the parent `/app` route.
- Why: Parents need a calm oversight workspace, not the same navigation-heavy shell rhythm as students or operators. Grouping the route by parent decisions, who needs attention, what changed this week, and where settings or billing live, makes the surface easier to scan and more aligned with the product's trust model.
- Follow-up: Keep validating the parent journey through real invite or approval walkthroughs, and only split more of this dashboard into separate routes if the linked-learner rail or grouped activity hub becomes overloaded.

### D-20260402-90 - Parent Approval Requests Become Visible And Actionable Inside The Parent Dashboard

- Date: 2026-04-02
- Status: accepted
- Related tasks: `P2.2`, `P1.3`
- Context: The product already let an under-13 student generate a parent-approval invitation and copy the resulting `/invite/[token]` URL, but a signed-in parent still had no way to discover or act on that request from their own `/app` surface. This created an avoidable dead end in the real parent walkthrough: if the adult lost the raw invite link, the dashboard itself gave no recovery path even though the invitation row still existed server-side and already targeted their authenticated email.
- Decision: Extend the parent dashboard snapshot to load pending parent-targeted invitations addressed to the signed-in email, render those requests as a dedicated left-rail panel on `/app`, and allow the parent to accept them directly from the dashboard. Keep the existing token-based `/invite/[token]` flow intact, but expand the canonical `POST /api/auth/parent-approval/confirm` route so it can resolve either a raw token or an invitation id for the signed-in parent, with the same role, email, expiry, and audit checks.
- Why: Parents should be able to complete the supervision flow from the product workspace they already signed into. This removes one major walkthrough friction point without weakening the existing security model, because the server still verifies the target role, authenticated email, invitation state, and parent-only acceptance before activating the link.
- Follow-up: This still is not a full notifications system. Delivery remains manual until the later Resend-backed slice, and broader parent or tutor journey evidence still belongs under `P2.2`.

### D-20260402-91 - Parent-Created Learner Bootstrap Is Added As An Additive Pilot Path, Using Interim Learner Credentials

- Date: 2026-04-02
- Status: accepted
- Related tasks: `P2.5`, `P2.2`, `P1.3`
- Context: Real parent-led MVP and Pilot walkthroughs exposed a gap in the current setup model. Billing, supervision, and learner configuration all live on the adult side, but the only working bootstrap path still required the learner to create the student account first and then request parent approval. That is awkward when the parent is the paying and supervising party. At the same time, the current auth model still couples each learner directly to `auth.users`, so a true parent-managed learner profile with no learner credentials would require a larger auth and schema redesign.
- Decision: Add a parent-created learner bootstrap path inside the parent `/app` workspace. A signed-in parent can now create a linked learner account, choose the learner's age band and default languages, and receive an immediate active parent-student link without disturbing the existing learner-created self-bootstrap flow. This first implementation is intentionally narrow and credential-based: it creates a real learner auth account with an initial email and temporary password because the current product still assumes every learner maps to a canonical auth user. Tutor-created learner bootstrap remains out of scope.
- Why: This aligns the product better with the real paying adult workflow while keeping risk bounded. Parents can control setup and billing from the correct account today, but the repo does not need to absorb a much larger managed-profile plus claim flow before more parent walkthrough evidence exists.
- Follow-up: Keep the original learner-created flow intact. If parent-led usage becomes the dominant path, consider a later Pilot refactor toward managed learner profiles plus a separate learner-claim or handoff flow so the product does not permanently rely on parent-chosen learner credentials.

### D-20260404-92 - The Student Role Gets Its Own Chat-First Shell, While Subjects Stay Filter-Only For Now

- Date: 2026-04-04
- Status: accepted
- Related tasks: `P1.1`, `P1.3`, `P2.1`, `P2.4`
- Context: The learner-facing `/app` surfaces had accumulated the same shell rhythm and card-heavy information architecture used during MVP delivery. That generic dashboard shape exposed too much chrome, repeated meta information, and forced the student through a more explicit session-creation and closure ritual than the intended product tone. At the same time, the backend still relies on explicit conversation creation, explicit completion, and a flat `subject_tag` on conversations rather than a real subject or project entity.
- Decision: Introduce a dedicated `StudentAppShell` for the student role only. The student shell now owns a collapsible left rail for activity modes plus subject-filter views, a quieter top bar, and a placeholder avatar dock with profile or settings entry. Move learner-owned memory plus parent/tutor support controls into `/app/settings`, redesign `/app/new` so it reads like "open the chat with this homework" while still creating the persisted conversation under the hood, flatten `/app/conversations/[conversationId]` into a chat-first layout with a lighter sources/notes rail, and simplify `/app/history` to match the calmer shell. Keep subjects as UI filters over `subject_tag` for this slice rather than introducing canonical subject entities, and keep explicit session completion in place for now.
- Why: This delivers the largest student-facing UX improvement without destabilizing the existing conversation, summary, upload, and oversight contracts. A chat-first shell can be implemented safely on top of the current backend, while the harder product questions about subject entities, implicit first-message creation, and automatic summary generation remain deferred until there is pilot evidence.
- Follow-up: Revisit whether the first learner message should implicitly create a conversation, whether summaries should auto-generate on chat closure without a manual completion step, whether the subject filter model should evolve into canonical subject entities with alias normalization, and whether the placeholder learner avatar should become a real pilot-level profile media feature.

### D-20260404-93 - The Student Shell Must Hide Structural Helper Copy And Keep Sidebar Or Subject Entry Minimal

- Date: 2026-04-04
- Status: accepted
- Related tasks: `P1.1`, `P1.3`, `P2.1`
- Context: The first student-shell pass still leaked too much implementation-facing guidance into the learner UI. Examples included helper subtitles like "Calm learner view", a heavier `/app/new` hero than the product needed, nested recent-chat lists inside the left subject rail, and a subject view that still felt like a dashboard card rather than a direct chat entry point with a visible secondary rail.
- Decision: Keep the same student-shell architecture, but tighten the presentation. The top header now uses a simple eyebrow-and-title pattern instead of structural subtitles. `/app/new` is reduced to a simple back-to-homework link plus the intake form. The left rail keeps only subject filters and counts, not nested conversation lists. The bottom profile dock stays visible, while the settings/sign-out controls move into a hover or focus menu. The subject view keeps only the essential heading, bare chat-entry field, recent chats, and a small right-side meta rail.
- Why: The learner shell should read like a calm product surface, not like a guided tour of its own structure. Removing explanatory chrome makes the interface easier to scan and better aligned with the intended client-facing tone.
- Follow-up: Continue trimming similar structural wording from the student history and any remaining student-facing empty states as the shell settles.

### D-20260404-94 - The Experimental Prompt Log Tracks Coherent Prompt-Driven Slices, Not Every Micro-Clarification

- Date: 2026-04-04
- Status: accepted
- Related tasks: `A0.3.7`
- Context: The experimental prompt log had drifted away from the actual chat rhythm. Some rows covered quick clarification or planning exchanges but looked like full implementation slices, while later assistant progress messages referenced rough elapsed time that did not match the manual row timestamps. This made the prompt log feel more precise than it really was and created avoidable confusion during review.
- Decision: Keep the prompt log experimental and manual, but redefine it as a trace of meaningful prompt-driven work slices rather than a literal row-for-every-user-message transcript. Short clarification bursts that stay inside the same active implementation or audit slice should be folded into the current row. Row durations must use real wall-clock start and end times, not elapsed estimates quoted in commentary messages.
- Why: The prompt log should help future agents reconstruct what kind of work happened when. Over-fragmenting it on every short back-and-forth produces misleading rows, while commentary-based elapsed estimates are too imprecise to act as canonical timing data.
- Follow-up: Continue using [work_sessions.md](work_sessions.md) as the canonical trace. If the prompt log remains noisy even after this rule change, consider deprecating it or reducing it to only major prompt slices.

### D-20260404-95 - External Connector Boilerplate Should Stay Out Of Repo-Facing Summaries Unless It Changes The Product

- Date: 2026-04-04
- Status: accepted
- Related tasks: `A0.3.7`
- Context: During recent student-shell work, the user noticed toolchain-level Netlify mentions surfacing in assistant summaries even though the project itself does not use Netlify for product behavior. The only actual Netlify references in the workspace live in dependency readmes under `node_modules`, and the visible assistant mention came from external connector instructions rather than a repo-owned artifact or a project decision.
- Decision: Treat external connector or toolchain boilerplate as implementation noise unless it materially changes the repository or the current task. Do not surface those names in repo-facing status summaries, product explanations, or traceability notes unless the repo itself contains a relevant dependency, integration, or behavior change.
- Why: Mixing external tooling scaffolding into repo summaries makes the project state look more complex than it is and distracts from the real source of truth inside the repository.
- Follow-up: Keep references to third-party connectors scoped to the exact operational action they affect. If the repo later adopts a real integration, document it explicitly in the relevant setup or architecture docs instead of relying on incidental tooling context.

### D-20260404-96 - The Prompt Log Returns To Accurate Per-Prompt Timestamps

- Date: 2026-04-04
- Status: accepted
- Related tasks: `A0.3.7`
- Context: A temporary protocol change reinterpreted [work_prompt_log.md](work_prompt_log.md) as a trace of broader prompt-driven slices instead of individual prompts. That drift produced rows whose durations no longer matched the operator's expectation of per-prompt timestamps, including one merged row on 2026-04-04 that could not be split back cleanly after the fact.
- Decision: Restore the prompt log to prompt-level granularity. Each handled user prompt should get its own row with actual wall-clock start and end times. Rough commentary messages like "worked for X minutes" remain non-canonical and must never drive the logged timestamps. If prompt boundaries are already lost for an older row, keep the row but mark it as approximate rather than pretending it is exact.
- Why: The prompt log exists to reconstruct the conversation timeline accurately. Merged slices may be useful for summaries, but they are not acceptable as the canonical prompt-level trace the operator expects.
- Follow-up: Keep [work_sessions.md](work_sessions.md) as the higher-level execution trace and [work_prompt_log.md](work_prompt_log.md) as the exact per-prompt timing trace. When in doubt, prefer over-logging prompts to merging them.

### D-20260404-97 - Prompt Rows Must Open Immediately At Prompt Start

- Date: 2026-04-04
- Status: accepted
- Related tasks: `A0.3.7`
- Context: Even after restoring per-prompt logging, a prompt can still be missed entirely if the row is only written at the end of the turn. That is exactly what happened with the immediately previous pass: the work was real, but no prompt row was created while the turn was in progress, so there was nothing to close accurately afterward.
- Decision: When [work_prompt_log.md](work_prompt_log.md) is active, create or update the current prompt row immediately at prompt start with `OPEN` as the temporary end marker. Before the final response, replace `OPEN` with the real end time and computed duration on that same row.
- Why: This is the only reliable way to prevent missing prompts without inventing timestamps after the fact. It also keeps short prompts accurate instead of forcing retrospective recovery.
- Follow-up: Use this rule going forward. For older missed prompts whose exact boundaries were never recorded, do not fabricate exact timestamps; either leave them missing or mark any recovery row as approximate.

### D-20260404-98 - Student Subject Quick-Start Now Creates A Bare Conversation Shell, While `/app/new` Becomes A Legacy Intake Fallback

- Date: 2026-04-04
- Status: accepted
- Related tasks: `P1.1`, `P1.3`, `P2.1`, `P2.4`
- Context: The first student-shell redesign still sent the learner through `/app/new` for the actual start of a homework discussion. That kept the older structured-intake contract visible in the product: the first persisted student message was a machine-written summary containing `Title`, `Subject`, `Graded homework`, and source-text labels, the learner did not get a direct chat start from the subject view, and the pre-chat `+` affordance could not stage files inline. This was visibly at odds with the intended chat-first experience.
- Decision: Keep the existing persisted conversation and explicit-completion model, but change the student-facing start path. The subject quick-start now creates a bare conversation shell through `POST /api/conversations?mode=shell`, optionally uploads any staged files to that conversation, sends the learner's first real message through the canonical message route, and only then opens `/app/conversations/[conversationId]`. Keep `/app/new` in the repo as a quieter fallback for the richer intake path, source-text review, and the still-legacy `graded homework` toggle, rather than deleting it immediately in the same slice.
- Why: This removes the most visibly "pilot" or developer-oriented parts of the learner flow without destabilizing persistence, uploads, moderation, summaries, or adult oversight. The learner now sees their own typed message as the first turn, uploads can be staged from the subject view, and the live conversation can behave more like a normal chat while the repo still retains the older intake route for any cases the new path does not cover yet.
- Follow-up: Decide during Pilot whether `/app/new` should disappear entirely once richer pre-chat source review has a better home, whether the `graded homework` flag should survive anywhere in the student-facing product, whether the shell-first creation step should later collapse into a fully implicit first-message create contract, and whether mid-start failures need a rollback or resumable-pending shell instead of leaving an empty conversation behind.

### D-20260404-100 - Prompt Rows Must Stay Open Until The Work Is Actually Finished

- Date: 2026-04-04
- Status: accepted
- Related tasks: `A0.3.7`
- Context: The first prompt-log fix restored per-prompt rows, but two later failures still happened. One prompt row carried the wrong duration because it inherited an earlier session-boundary timestamp instead of the actual prompt start, and the next prompt row was closed before the substantive repo inspection had finished, producing a `0h00` trace for work that clearly continued afterward.
- Decision: Keep the prompt log as an exact per-prompt trace, but make the timing rule stricter: create the row immediately with `OPEN`, leave it `OPEN` for the whole active handling window, and only replace `OPEN` with the real end time once the work is actually complete and the final response is about to be sent.
- Why: Prompt rows are supposed to measure real handling time, not planning checkpoints. Closing a row early makes the trace just as misleading as merging several prompts into one line.
- Follow-up: Apply this rule going forward, and when a bad row is caught quickly and the operator supplies the intended duration, correct it directly instead of leaving the wrong timing in place.

### D-20260404-99 - Onboarding Now Collects Only Remaining Profile Essentials, And The Standalone Route Is Transitional

- Date: 2026-04-04
- Status: accepted
- Related tasks: `P1.3`, `P2.1`, `P2.6`
- Context: The current account-creation flow already asks the user to choose a role during sign-up, but `/onboarding` still repeated that role selector and still carried the heavier shared public footer. This made the route feel like a second sign-up step instead of a short profile-confirmation pass. At the same time, the onboarding form still owns fields that the current sign-up flow does not yet collect, especially learner age-gating for the under-13 approval path.
- Decision: Remove the redundant role selector from `/onboarding`, keep only the remaining profile-essential fields on that route, and opt the route out of the shared public footer so it reads like a short transitional setup step. Treat the standalone onboarding page as temporary, and log a Pilot follow-up to merge it into sign-up once account creation can safely own role, age-gating, and profile essentials in one flow.
- Why: This keeps the current auth and minors-approval logic stable while removing an unnecessary extra decision from the user-facing flow. The route becomes shorter immediately without prematurely deleting the fields that still matter for student activation and parent-approval rules.
- Follow-up: Complete `P2.6` by moving the remaining onboarding fields into sign-up, then remove or repurpose the standalone `/onboarding` route instead of continuing to polish it as a permanent page.

### D-20260404-101 - `/app/new` Is Retired From The Student Journey And Now Redirects Into The Homework Dashboard

- Date: 2026-04-04
- Status: accepted
- Related tasks: `P1.3`, `P2.1`, `P2.6`
- Context: The newer subject quick-start already made `/app/new` structurally obsolete for learners. The visible product flow had become chat-first on `/app`, while `/app/new` still advertised a second start path based on the older richer intake page and its `graded homework` framing.
- Decision: Retire `/app/new` from the visible student journey. The route now acts only as a compatibility redirect into `/app?view=homework`, preserving `subject` and `draft` query params so older links still land on the current subject-level composer. Update the student dashboard, history CTAs, sidebar affordances, and shared student navigation copy so every visible student start or restart path now routes back through the homework dashboard instead of the retired page.
- Why: This makes the product honest. Students now have one obvious place to start homework and resume discussions, which matches the current chat-first design direction and removes the last visible CTA paths that still pulled learners toward the older intake ritual.
- Follow-up: Decide later whether the now-hidden richer intake code should be repurposed into an in-flow source-review surface or deleted entirely once the homework dashboard path proves sufficient.

### D-20260404-102 - The Empty Homework Dashboard Must Be Able To Start The First Subject

- Date: 2026-04-04
- Status: accepted
- Related tasks: `P1.3`, `P2.1`, `P2.6`
- Context: Retiring `/app/new` exposed a new dead end for first-time learners. The empty homework dashboard still assumed that at least one `subject_tag` already existed, so the only visible action on `/app?view=homework` was a CTA that linked back to the same page. That made the new canonical student landing unusable for a brand-new learner.
- Decision: Keep `/app` as the canonical student landing and make the empty homework state responsible for bootstrapping the first subject. The empty state now renders a lightweight subject selector plus the same direct chat launcher used by the subject view, so the first conversation can be created from the dashboard itself and can establish the first `subject_tag` without reviving `/app/new`.
- Why: This preserves the simpler chat-first student journey instead of reopening a second intake route. The learner still starts from one place, but the dashboard no longer depends on pre-existing history before it becomes actionable.
- Follow-up: Revisit later whether subject selection should stay a lightweight first-message affordance or evolve into canonical subject entities with richer creation rules.

### D-20260404-103 - Ignore Netlify Preflight Tooling Unless Netlify Work Is Actually In Scope

- Date: 2026-04-04
- Status: accepted
- Related tasks: `A0.3.7`
- Context: A generic tool instruction outside the repo kept encouraging a Netlify coding-context preflight before code-writing, even though this project is not currently using Netlify for its product workflows. That led to repeated pointless tool attempts and noisy failures during ordinary UI and student-flow work.
- Decision: Treat Netlify coding-context and Netlify service tools as explicitly opt-in for this repo. Only call them when the task is genuinely about Netlify deployment, Netlify SDK usage, Netlify functions, or Netlify-managed resources. For normal product, UI, auth, dashboard, or docs work, skip them entirely.
- Why: The preflight adds no value to the current repo, introduces avoidable tool noise, and confuses the user when it appears in otherwise local implementation work.
- Follow-up: Keep this override in `AGENTS.md` and prefer repo-specific workflow rules over generic external tool prompts when they conflict with the actual stack in use.

### D-20260404-104 - The Student Conversation Rail Now Owns Only Files Plus Explicit Completion

- Date: 2026-04-04
- Status: accepted
- Related tasks: `P1.3`, `P2.1`
- Context: The refreshed student conversation surface still carried too much of the older pilot-era right rail: a full attachment status section plus a large session-summary card. That conflicted with the newer chat-first product direction and made the live homework discussion feel heavier than the intended learner experience.
- Decision: Collapse the live student right rail into two things only: a minimal file area at the top and one explicit completion control at the bottom. The file area now shows a grey empty state when nothing is uploaded and shows uploaded files as removable pills when attachments exist. The old learner-facing attachment detail list and session-summary card are retired from the live workbench, and a new `DELETE /api/attachments/[attachmentId]` route now owns student attachment removal.
- Why: This keeps the conversation route closer to a chat tool instead of a structured pilot dashboard, while still preserving the current backend contract that completion is explicit and attachment storage stays private plus server-owned.
- Follow-up: If the product later keeps attachment deletion long-term, revisit whether extracted text already copied into the hidden workspace should also be scrubbed when its source attachment is removed.

### D-20260406-105 - Learner-Facing Chat Failures Must Not Leak Internal Draft-Coach Copy

- Date: 2026-04-06
- Status: accepted
- Related tasks: `P1.3`, `P2.1`, `A7.4.6`
- Context: The refreshed chat-first student flow still let one internal failure path leak through to learners. When the Gemini coach call failed inside `appendConversationMessage`, the service caught the provider error and wrote the old deterministic `Coach brouillon` fallback into the transcript. That was acceptable as an internal scaffolding path earlier in MVP, but it now reads like debug or draft tooling in a learner-facing product.
- Decision: Keep the provider error catch, but replace the learner-visible fallback text with a normal localized retry-style assistant reply. The transcript should never surface the old internal draft-coach wording to learners. At the same time, extend the student chat inputs to accept pasted clipboard images through the same private upload path already used by the file picker, so the simplified chat surface still supports common screenshot-first workflows without reopening the older intake ritual.
- Why: This keeps the student chat honest. If the provider fails, the learner sees a calm product reply instead of internal scaffolding, and the new chat-first UI still supports a practical "paste screenshot, then ask" workflow.
- Follow-up: Improve provider reliability and runtime visibility so the learner-facing retry fallback becomes genuinely rare, and later decide whether richer pre-send file staging belongs directly in the subject quick-start.

### D-20260406-106 - Pilot Subject Tuning Should Use Internal Mode Variants, And Subject-Wide Libraries Should Retrieve Chunks Instead Of Re-Parsing Whole Documents

- Date: 2026-04-06
- Status: accepted
- Related tasks: `P2.4`, `P2.7`, `P4.4`
- Context: Pilot planning now needs three kinds of product tuning that are broader than the current one-size-fits-all coach behavior. First, some subject families clearly need stricter answer policies than others, especially quantitative subjects where units, dimensional correctness, and equation formatting matter. Second, the team wants to test different reply registers such as a more formal teacher-like voice versus a friendlier child-facing tone. Third, learners are likely to need longer-lived subject resources such as full textbooks or year-long notes that can be reused across many homework chats, but naively re-sending or re-parsing those large files on every request would create avoidable cost and relevance problems.
- Decision: Treat subject-family answer policy and reply-style work as Pilot tuning variants rather than as permanent end-user settings for now. Keep those variants internal to testing and prompt iteration first, ideally using the dev-only mock-AI path or separate Gemini-project guidance tracked in `P4.4` so style experiments do not burn real pilot quota unnecessarily. For shared subject resources, do not design the system around re-reading whole textbooks on every conversation turn. Instead, plan a subject-library layer that extracts once, stores chunked or section-level representations plus metadata, lets the learner toggle relevant resources per conversation, and retrieves only the most relevant sections for the current request.
- Why: This keeps Pilot experimentation cheap and reviewable. It avoids prematurely exposing confusing user settings for tone or subject modes, and it prevents the large-document path from becoming both expensive and noisy before the product has a retrieval strategy.
- Follow-up: Define the first subject-family test matrix under `P2.4`, including at least quantitative versus non-quantitative families plus formal-versus-friendly reply variants. Under `P2.7`, decide whether the first shared-resource implementation should begin with deterministic chunking and section metadata only, or whether embeddings or indexing are needed during Pilot.

### D-20260406-107 - Homework Root And Subject Creation Now Share One Student Flow

- Date: 2026-04-06
- Status: accepted
- Related tasks: `P1.3`, `P2.1`
- Context: The student shell had drifted into three overlapping homework entry shapes: the root `/app?view=homework` overview, a separate selected-subject quick-start view, and a hidden `newSubject` launcher mode. That made the product harder to reason about, and it created a real learner-facing confusion about why `/app?view=homework` and `/app?view=homework&newSubject=1` seemed to represent different workflows even though they were really both trying to start homework.
- Decision: Remove the separate new-subject mode from the real student flow. The root homework view now always owns subject selection and subject creation directly through subject pills plus the quick-start launcher, whether the learner already has existing subject tags or not. The left-rail `+` remains as a discoverability affordance, but it now just returns to the same root homework view instead of switching the product into a second launcher state.
- Why: This makes the student flow honest and easier to learn. There is now one root homework surface, one selected-subject quick-start surface, and one live conversation surface, instead of two root variants that differed only by hidden URL state.
- Follow-up: If subjects later become canonical entities instead of `subject_tag` filters, keep the same user-facing rule: subject creation should still feel like part of the homework home, not like a separate hidden mode.

### D-20260406-108 - Student Chat Now Uses Optimistic Learner Turns And A Lightweight Pending Banban Placeholder

- Date: 2026-04-06
- Status: accepted
- Related tasks: `P1.3`, `P2.1`
- Context: Even after the chat-first redesign, sending a learner message still felt unresponsive. The textarea kept the full prompt while the network round trip ran, so it looked like nothing had happened yet. The thread also had no avatar treatment, which made the conversation feel flatter than the messaging-app reference the learner UI is now aiming toward.
- Decision: Keep the server-owned persistence model, but make the student conversation feel immediate on the client. The live workbench now clears the textarea right away, appends the learner's message optimistically, and shows a lightweight pending assistant placeholder with a scanning shimmer until the real banban reply comes back. At the same time, both learner and assistant turns now carry simple avatar treatments in the thread, and the runtime no longer keeps any separate `newSubject` URL mode for the homework home.
- Why: This preserves the real backend contract while making the chat feel responsive and legible. The learner immediately sees that their message has been accepted, and the assistant side now reads more like a normal conversation instead of a raw transcript dump.
- Follow-up: If the subject quick-start itself still feels too inert before the route transition completes, consider passing a one-shot pending turn state into the first opened conversation page rather than leaving the learner on the launcher until the first round trip finishes.

### D-20260406-109 - Student Reply Modes Are Prompt-Level Variants, Not Separate Models

- Date: 2026-04-06
- Status: accepted
- Related tasks: `P1.3`, `P2.1`, `P2.4`
- Context: The pilot backlog already tracked `fast`, `thinking`, and `interactive` answer modes as an internal testing idea, but the student chat tools now need a concrete switch in the learner UI. Without an explicit implementation rule, that could easily drift into either fake UI chrome with no backend effect or a misleading "model picker" mental model that the product does not actually support.
- Decision: Implement reply modes as prompt-level coaching variants on the existing student coach path, not as separate AI models. The student chat now exposes a minimal mode switch in both the subject quick-start and the live conversation composer, and each selection is sent through the normal message route as `replyMode`. The current matrix is: `fast` for shorter direct answers, `thinking` for more explicit structure and checking, and `interactive` for more guided back-and-forth. These variants change the coaching instructions inside the student coach prompt while keeping the same provider, safety path, and persistence model underneath.
- Why: This is straightforward to ship, easy to reason about, and honest about what the product is doing. It gives the team a real surface for Pilot testing without pretending that learners are choosing between different underlying models.
- Follow-up: Review transcript quality by subject family, especially for quantitative subjects where `thinking` should stay stricter about units and equation handling, and decide later whether these modes should remain learner-visible or fall back to an operator-only experiment.
