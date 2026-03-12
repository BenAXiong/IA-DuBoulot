# App Shell V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [API route map](api_route_map.md) | [Invitation flows V1](invitation_flows_v1.md) | [Privacy controls V1](privacy_controls_v1.md) | [Service interfaces](service_interfaces.md)

## Purpose

This document records the first shared shell structure for the public site and authenticated app.

It exists so future sessions do not treat:

- landing pages
- auth pages
- invite pages
- onboarding
- protected `/app`

as unrelated one-off layouts.

## Public Shell

Code:

- `components/layout/public-shell.tsx`

Current routes using it:

- `/`
- `/pricing`
- `/auth`
- `/onboarding`
- `/invite/[token]`

Rules:

- public routes share one branded header and footer
- auth and invite flows should feel like the same product as the landing page
- pricing remains intentionally provisional while the MVP still exposes only one wired Family monthly plan
- the shell now carries the active UI language through shared dictionaries and a small client-side `document.documentElement.lang` sync instead of hardcoded French-only chrome
- the shell now also exposes the shared light or dark theme toggle instead of leaving theme preference implicit in CSS alone, but the public chrome keeps it to a single icon button rather than a labeled segmented control
- the landing route now keeps operator and deep-link shortcuts behind a floating helper button so the user-facing page can stay calmer than the previous toolbox-style entry

## Authenticated App Shell

Code:

- `app/app/layout.tsx`
- `components/layout/app-shell.tsx`

Current routes using it:

- `/app`
- `/app/history`
- `/app/new`
- `/app/conversations/[conversationId]`
- `/app/settings`
- `/app/students/[studentUserId]`
- `/app/review/[conversationId]`
- `/app/audit`

Rules:

- the shell owns responsive navigation and session chrome
- page content under `/app` should focus on role-specific panels, not duplicate nav/header code
- the shell is role-aware, but not role-bloated: role-specific content lives in dashboard modules, not inside the chrome component
- non-admin accounts already queued for deletion are redirected back toward `/app/settings`, and the shell repeats that frozen-state warning in the shared header
- shared shell chrome and the account-settings block on `/app` now localize from `lib/i18n/ui-copy.ts`; deeper role dashboards still own their own remaining translation debt
- the authenticated shell now also shares the same light or dark theme toggle and bootstrap path as the public shell, so the app chrome does not diverge into a second theme system

## Role Dashboard Variants

Current modules:

- `components/dashboard/student-dashboard.tsx`
- `components/dashboard/parent-dashboard.tsx`
- `components/dashboard/tutor-dashboard.tsx`
- `components/dashboard/admin-dashboard.tsx`

Shared building block:

- `components/dashboard/dashboard-card.tsx`

Rule:

- each role gets its own dashboard module to avoid a god `/app/page.tsx`

## Navigation Model

The authenticated shell now mixes stable sub-routes with a few local anchors:

- student workflow routes:
  - `/app/new`
  - `/app/history`
  - `/app/conversations/[conversationId]`
  - `/app/settings`
- adult oversight routes:
  - `/app/students/[studentUserId]`
  - `/app/review/[conversationId]`
  - `/app/audit`
- local anchors still used for dashboard sections that have not earned their own route:
  - `#students`
  - `#account`

Why:

- the student workflow, settings/privacy controls, and adult review flow now all have enough depth to deserve stable URLs
- the shell still avoids exploding into route sprawl for every small metric or summary card that can remain dashboard-local

## iPad Validation

The shell is designed for:

- stacked content and horizontal nav below `lg`
- sidebar navigation from `lg` upward
- card grids that expand from 1 to 2 to 3 columns across breakpoints

Recorded check:

- date: 2026-03-11
- method: browser-emulated tablet pass with Playwright screenshots
- widths checked: `820x1180` portrait and `1180x820` landscape
- routes checked: `/auth`, `/app`, `/invite/[token]` recovered state
- result: no horizontal overflow detected on the checked shell surfaces

Scope boundary:

- this closes `A2.3.4` for shell-width validation
- actual iPad Safari behavior, keyboard behavior, and upload/chat ergonomics still belong to phase `A7.1`

## Known Follow-Ups

- convert anchor sections into real route destinations as dashboards grow
- continue the trilingual pass inside the deeper student, parent, tutor, and admin dashboard content
- validate the shell on actual iPad Safari during `A7.1`
- add role-specific empty states that consume real data rather than static MVP guidance copy
