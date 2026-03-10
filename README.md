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
- Initial RLS policy draft exists in `supabase/migrations/20260310_000002_access_rules_and_rls.sql` and still needs to be applied and verified in Supabase.
- The next recommended execution step is Phase `A0.1` through `A1.3` in [the MVP to-do list](docs/mvp_todo.md).

## Working Conventions

- Use task IDs from [the MVP to-do list](docs/mvp_todo.md) in session notes, decision log entries, commit messages, and review notes.
- Treat [the decision log](docs/decision_log.md) and [the work sessions log](docs/work_sessions.md) as mandatory maintenance files, not optional notes.
- Update this file whenever a new top-level project doc becomes part of the operating workflow.
