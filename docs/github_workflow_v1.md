# GitHub Workflow V1

Related: [README](../README.md) | [Branch and PR conventions](branch_pr_conventions.md) | [Decision log](decision_log.md) | [MVP to-do list](mvp_todo.md) | [Work sessions log](work_sessions.md)

## Purpose

This document captures the repository-owned GitHub workflow artifacts and the current remote GitHub workflow baseline so the label and template state stays reviewable in git.

## Repo-Owned Workflow Artifacts

Current files:

- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/workflow_slice.md`
- `.github/ISSUE_TEMPLATE/ops_gap.md`
- `.github/ISSUE_TEMPLATE/config.yml`
- `.github/labels.json`

## Template Intent

- `bug_report.md`: regressions against the documented contract
- `workflow_slice.md`: bounded implementation slices tied to task IDs
- `ops_gap.md`: external provisioning or device blockers that the repo cannot close itself

Rules:

- always include task IDs when they exist
- capture verification state, not just desired changes
- use ops-gap issues when the blocker is GitHub, Vercel, Lemon Squeezy, PostHog, Resend, or device access
- keep repository state publishable: once a coherent slice is verified, commit it with task IDs and push it instead of leaving the canonical state only in a local dirty worktree

## Label Manifest

`/.github/labels.json` is the canonical label manifest for the MVP and early pilot phases.

Current label groups:

- type labels
- triage state
- external-blocker marker
- risk-area markers for student flow, oversight, and billing/AI

## Remote Sync Status

On 2026-03-12 the public repository labels were synced from `.github/labels.json` through an authenticated GitHub CLI pass.

The current remote label set is:

- `type:bug`
- `type:work`
- `type:ops`
- `needs:triage`
- `blocked:external`
- `risk:student-flow`
- `risk:oversight`
- `risk:billing-ai`

Rule:

- treat `.github/labels.json` as the source of truth and reapply it if the remote labels drift
- treat pushed git history as part of the operating trace; docs and code are not considered durably handed off until the verified slice has been committed and pushed
