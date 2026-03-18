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
- the shared theme layer now defaults to the operating-system light or dark preference, but MVP chrome may expose one simple light-or-dark icon toggle when that improves usability without reopening the old preset/custom theme lab
- the landing route now keeps operator and deep-link shortcuts behind a floating helper button so the user-facing page can stay calmer than the previous toolbox-style entry
- the public chrome now uses a compact globe-menu language selector instead of always-visible inline language pills, and the control geometry must stay unclipped at small shell sizes
- the public shell no longer renders the subtitle under the wordmark on `/`, and the top bar now runs nearly the full landing width instead of staying on the narrower `6xl` rail
- the home route may opt out of the shared public footer when a page-owned closing CTA gives a cleaner public narrative than the heavier shell footer
- the auth route may also opt out of the shared public footer when a viewport-fit form layout is more important than repeating public narrative copy below the fold
- the home route now also uses a wider canvas with centered hero and closing CTA copy, while the product-story body alternates `1 preview + 3 glass cards` rows so future GIFs can scale without collapsing text legibility
- the current landing media frames now use neutral moving placeholder GIFs from public sources, stored locally in `public/landing/`, so the layout can be judged with real motion before actual product captures are ready
- the shared primary CTA now uses a slow background-position drift, so motion stays at the token layer instead of becoming page-local decoration
- the auth route now uses a compact viewport-fit layout with a mini HUD-style header, a single centered auth card, and a stable-width segmented `Sign in` or `New user` switch as the first visible block; any explanatory copy above the toggle should stay absent unless real testing shows it is needed

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
- the authenticated shell still shares the same theme bootstrap as the public shell, and now mirrors the public utility cluster with a simple light-or-dark toggle plus the language menu in the top header
- the authenticated header must use overflow-allowing variants on every ancestor class that clips by default when hover menus are mounted inside it; on the current shell header that means both `shell-panel--allow-overflow` and `page-glow--allow-overflow`
- the authenticated language control must update the saved app profile language, not just rewrite the URL query string used on public routes
- authenticated app routes may honor the short-lived `ia_ui_lang` cookie as an immediate UI-language override during the refresh triggered by the authenticated language menu, so the visible server-rendered copy can switch before the slower profile write fully completes
- the authenticated shell should not surface pilot badges, literal route hints, or other implementation-facing framing on the main role dashboards
- the parent role now suppresses the generic desktop shell sidebar and instead lets the dashboard own a parent-specific information architecture: account and billing dock plus linked-learners rail on the left, with grouped weekly and recent activity on the right

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
- the parent dashboard is now further split into dedicated parent-owned building blocks instead of one placeholder surface: `parent-account-dock.tsx`, `parent-learners-rail.tsx`, `parent-activity-hub.tsx`, and `parent-dashboard-presenters.ts`

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
- `#account` remains relevant for the shared settings block used by non-parent roles, while parent account and billing controls now live inside the parent dashboard rail instead of a separate bottom section on `/app`

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
- validate the new parent-specific shell rhythm in real walkthroughs so the learner rail, billing dock, and grouped activity panels stay calmer than the generic shared-sidebar pattern they replaced
