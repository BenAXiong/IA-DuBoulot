# GitHub Workflow V1

Related: [README](../README.md) | [Branch and PR conventions](branch_pr_conventions.md) | [Decision log](decision_log.md) | [MVP to-do list](mvp_todo.md) | [Work sessions log](work_sessions.md)

## Purpose

This document captures the repository-owned GitHub workflow artifacts so they are reviewable in git even when the remote GitHub settings are not directly editable from the current session.

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

## Label Manifest

`/.github/labels.json` is the canonical label manifest for the MVP.

Current label groups:

- type labels
- triage state
- external-blocker marker
- risk-area markers for student flow, oversight, and billing/AI

Current limitation:

- the manifest lives in git, but labels still need to be created or synced in the GitHub repository through the GitHub UI or an authenticated API workflow

That remote application step remains outside the repo-owned scope.
