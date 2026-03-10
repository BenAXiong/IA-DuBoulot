# Branch And PR Conventions

Related: [README](../README.md) | [AGENTS](../AGENTS.md) | [MVP to-do list](mvp_todo.md) | [Decision log](decision_log.md) | [Work sessions log](work_sessions.md)

## Goal

Keep `main` clean and reviewable without creating process overhead that slows a solo founder using Codex heavily.

## Recommended GitHub Ruleset

Apply this to `main`:

- Enforcement status: `Active`
- Restrict deletions: `On`
- Restrict force pushes: `On`
- Require a pull request before merging: `Off` for now
- Allowed merge methods: prefer `Squash` when PRs are used

Important:

- this matches the current solo-founder bootstrap workflow and keeps direct pushes available
- turn PR enforcement on later when CI and a steadier branch review rhythm exist

## Default Working Flow

1. Pull the latest `main`.
2. For small or low-risk work, direct commits to `main` are acceptable if the traceability docs are updated in the same change.
3. For larger or riskier work, create a task-scoped branch.
4. Make the change.
5. Update docs, logs, and task status in the same branch or commit set.
6. Open a PR to `main` when branch review adds value.
7. Squash merge when the branch is coherent.

## Branch Naming

Format:

`<type>/<task-id>-<short-scope>`

Examples:

- `feat/A1.3-api-route-map`
- `fix/A3.2-upload-preview`
- `docs/A0.4-role-access-matrix`
- `chore/A2.1-next-scaffold`

Recommended types:

- `feat`
- `fix`
- `docs`
- `chore`
- `refactor`
- `test`

## Commit Message Format

Start commit messages with task IDs when possible.

Examples:

- `A2.1.1 A2.1.2 scaffold next app`
- `A1.2 implement initial RLS policies`
- `A0.4.1 write role access matrix`

## PR Title Format

Use:

`<task-id> short description`

Examples:

- `A2.1 scaffold next app`
- `A1.2 add initial access policies`

## PR Description Minimum

Every PR should state:

- what changed
- why it changed
- which task IDs it covers
- what was verified
- what remains open

## Direct Push Guardrails

Direct pushes to `main` are acceptable right now if:

- the change stays understandable as a single coherent update
- the traceability docs are updated in the same change
- the task IDs are present in commit and log context

Even in that case:

- update [work_sessions.md](work_sessions.md)
- update [decision_log.md](decision_log.md) if structure changed
- update [mvp_todo.md](mvp_todo.md) task state

Later target:

- once CI exists and the repo is less bootstrap-heavy, turn on `Require a pull request before merging`
