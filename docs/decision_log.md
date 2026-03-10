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

### D-20260310-11 - Personal AI Subscriptions Are Not Backend Fallback Providers

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A0.2.4`, `A4.1`
- Context: The founder has a personal AI subscription under active use and mentioned it as a possible fallback.
- Decision: Do not treat founder personal subscriptions as application-backend fallback providers. The production-capable API fallback remains open, with OpenAI API as the likely later candidate after MVP validation.
- Why: Personal subscriptions are not a clean deployable backend dependency and create unclear rate-limit, terms, and operational risks.
- Follow-up: Select the real API fallback when production load and paid-user economics justify it.
