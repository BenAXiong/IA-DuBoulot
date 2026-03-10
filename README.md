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
- [API route map](docs/api_route_map.md)
- [Service interfaces](docs/service_interfaces.md)
- [Error and audit conventions](docs/error_audit_conventions.md)
- [Storage and attachment rules](docs/storage_attachment_rules.md)
- [MVP to-do list](docs/mvp_todo.md)
- [MVP timeline](docs/mvp_timeline.md)
- [Decision log](docs/decision_log.md)
- [Work sessions log](docs/work_sessions.md)
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
- Backend contract docs now define the API route surface, service boundaries, error/audit rules, and storage rules.
- Supabase SSR auth helpers, `proxy.ts`, and the first authenticated API routes are now implemented in code.
- Deterministic hosted fixture seed and verification scripts now exist for live RLS visibility checks across student, parent, tutor, and admin roles.
- The first hosted fixture reseed and live RLS verification now pass against the hosted Supabase project with `17` checks and `0` failures.
- The next recommended execution step is `A1.4.2` sample attachment corpus work, then `A2.2` user-facing auth onboarding.

## Working Conventions

- Use task IDs from [the MVP to-do list](docs/mvp_todo.md) in session notes, decision log entries, commit messages, and review notes.
- Treat [the decision log](docs/decision_log.md) and [the work sessions log](docs/work_sessions.md) as mandatory maintenance files, not optional notes.
- Update this file whenever a new top-level project doc becomes part of the operating workflow.
