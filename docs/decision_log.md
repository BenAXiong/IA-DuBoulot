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

### D-20260310-13 - Main Branch Workflow Uses Active Protection And Lightweight PRs

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A0.1.2`, `A0.1.5`
- Context: The repo now needs a durable main-branch workflow that keeps history clean without blocking a solo founder using Codex heavily.
- Decision: Use an active GitHub ruleset on `main`, keep `Require a pull request before merging` enabled with `0` required approvals, prefer squash merges, and use repository-owner bypass only for bootstrap or emergency direct pushes.
- Why: This gives branch discipline without inventing review overhead the repo cannot support yet.
- Follow-up: Add required status checks once CI exists.

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

### D-20260310-11 - Personal AI Subscriptions Are Not Backend Fallback Providers

- Date: 2026-03-10
- Status: accepted
- Related tasks: `A0.2.4`, `A4.1`
- Context: The founder has a personal AI subscription under active use and mentioned it as a possible fallback.
- Decision: Do not treat founder personal subscriptions as application-backend fallback providers. The production-capable API fallback remains open, with OpenAI API as the likely later candidate after MVP validation.
- Why: Personal subscriptions are not a clean deployable backend dependency and create unclear rate-limit, terms, and operational risks.
- Follow-up: Select the real API fallback when production load and paid-user economics justify it.
