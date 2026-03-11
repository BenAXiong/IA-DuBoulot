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
