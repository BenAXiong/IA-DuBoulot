# Branch And PR Conventions

Related: [README](../README.md) | [AGENTS](../AGENTS.md) | [MVP to-do list](mvp_todo.md) | [Decision log](decision_log.md) | [Work sessions log](work_sessions.md)

## Goal

Keep `main` clean and reviewable without creating process overhead that slows a solo founder using Codex heavily.

## Recommended GitHub Ruleset

Apply this to `main`:

- Enforcement status: `Active`
- Restrict deletions: `On`
- Restrict force pushes: `On`
- Require a pull request before merging: `On`
- Required approvals: `0`
- Dismiss stale approvals: `Off`
- Require review from specific teams: `Off`
- Require review from Code Owners: `Off`
- Require approval of the most recent reviewable push: `Off`
- Require conversation resolution before merging: `Off` for now
- Allowed merge methods: prefer `Squash` only

Recommended bypass:

- repository owner only

Important:

- if `Require a pull request before merging` is on and there is no bypass, direct pushes to `main` will be blocked
- use owner bypass only for bootstrap or emergency work, not as the default workflow forever

## Default Working Flow

1. Pull the latest `main`.
2. Create a task-scoped branch.
3. Make the change.
4. Update docs, logs, and task status in the same branch.
5. Open a PR to `main`.
6. Squash merge when the branch is coherent.

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

## Bootstrap Exception

During early bootstrap, direct pushes may still happen if:

- the owner uses bypass intentionally
- the change is low-risk and traceability docs are updated

Even in that case:

- update [work_sessions.md](work_sessions.md)
- update [decision_log.md](decision_log.md) if structure changed
- update [mvp_todo.md](mvp_todo.md) task state
