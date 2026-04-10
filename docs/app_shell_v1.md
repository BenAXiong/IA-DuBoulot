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
- the onboarding route now also opts out of the shared public footer and keeps only the remaining profile-essential fields that sign-up does not yet own; role selection stays in account creation and the standalone onboarding route is now a transitional step rather than a destination to enrich further

## Authenticated App Shell

Code:

- `app/app/layout.tsx`
- `components/layout/app-shell.tsx`
- `components/layout/student-app-shell.tsx`

Current routes using it:

- `/app`
- `/app/new` (compatibility redirect into `/app?view=homework`)
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
- the student role now owns its own chat-first shell rhythm through `components/layout/student-app-shell.tsx`: collapsible left subject rail, minimal top bar, profile dock, and a quieter page canvas than the original generic `/app` chrome
- the student shell now carries four learner activity entries in the left rail: `Dashboard`, `Forward`, `Maps`, and `Tests`; only `Dashboard` is a real workflow today, while the others remain intentional placeholders until the pilot decides which tools deserve a full product surface
- the student shell header now uses a simple eyebrow-and-title pattern instead of helper subtitles that describe the interface itself
- the left student rail no longer shows a divider under the wordmark block; its top strip should visually match the main-pane header height without introducing a second header rule
- the learner profile dock no longer shows a permanent outlined account section; the dock stays minimal by default, and the profile/settings/sign-out menu stays open while hovered with a short close grace period
- the student shell top strips are intentionally slimmer than the earlier MVP shell, and the utility/collapse icons should use the same smaller outline-free treatment instead of looking like a second layer of heavy controls
- the left rail now uses `Dashboard` as the top student entry instead of repeating `Homework`, while the sidebar header itself keeps only the animated `bb` mark and collapse control
- the parent role now suppresses the generic desktop shell sidebar and instead lets the dashboard own a parent-specific information architecture: account and billing dock, pending parent-approval requests, a learner-creation panel, and linked-learners rail on the left, with grouped weekly and recent activity on the right

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
- the student role now also gets its own shell treatment instead of only a role-specific dashboard module; the dashboard content is still role-specific, but the chrome and navigation rhythm are no longer shared with adult roles
- the parent dashboard is now further split into dedicated parent-owned building blocks instead of one placeholder surface: `parent-account-dock.tsx`, `parent-learners-rail.tsx`, `parent-activity-hub.tsx`, and `parent-dashboard-presenters.ts`
- the parent dashboard now also includes `parent-pending-approvals-panel.tsx`, which surfaces parent-targeted pending invitations addressed to the signed-in email and lets the parent accept them directly from `/app` without reopening the original invite URL
- the parent dashboard now also includes `parent-create-learner-panel.tsx`, which adds the additive parent-created learner bootstrap path while leaving the original learner-created onboarding flow intact

## Navigation Model

The authenticated shell now mixes stable sub-routes with a few local anchors:

- student workflow routes:
  - `/app/new` compatibility redirect
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
- the retired `/app/history` route now only exists as a compatibility redirect back into the homework surface; the student shell no longer treats it as a first-class destination
- the shell still avoids exploding into route sprawl for every small metric or summary card that can remain dashboard-local
- `#account` remains relevant for the shared settings block used by non-parent roles, while parent account and billing controls now live inside the parent dashboard rail instead of a separate bottom section on `/app`
- the student shell now treats subjects as filter views over existing `subject_tag` values and sends learner-owned support settings to `/app/settings`, so the main `/app` page can behave more like a chat workspace than a control center
- the subject rail now keeps only subject filters and counters; recent conversation lists stay in the main content area instead of expanding inside the sidebar
- the homework block in the student rail now keeps a hover `+` entry point for creating or selecting a subject directly from the same root homework view, and the Homework heading itself returns the learner to that root view instead of exposing a second subject-creation mode
- the profile dock now defaults to a minimal identity row with no outline, while settings and sign-out live in a hover/focus menu above it
- the subject quick-start now creates a bare conversation shell, uploads any staged files, sends the learner's first real message, and only then routes into `/app/conversations/[conversationId]`, so the main student view behaves more like a chat launcher than a wizard entry
- the student subject view and live conversation surface now both use a true right-side panel treatment instead of floating cards, so the workspace reads like a split main pane rather than a dashboard grid
- only the live conversation route keeps that right-side panel; the subject-selection view returns to a single main column until a real chat exists
- on desktop, the student sidebar now keeps a viewport-height column independent from main-pane scroll, so the left rail behaves like a true app navigation pane instead of stretching with the homework content

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
- decide later whether the student shell should keep subject filters only, whether the hidden legacy intake code behind the `/app/new` redirect should be repurposed or removed, and whether conversation creation can become even more implicit than the current shell-first quick-start
