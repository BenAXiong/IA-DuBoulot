# App Shell V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [API route map](api_route_map.md) | [Public landing page revamp brief](public_landing_page_revamp_brief.md) | [Invitation flows V1](invitation_flows_v1.md) | [Privacy controls V1](privacy_controls_v1.md) | [Service interfaces](service_interfaces.md)

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
- `components/layout/public-header.tsx`
- home route body: `components/landing/public-landing-page.tsx`
- landing-revamp working brief: `docs/public_landing_page_revamp_brief.md`

Current routes using it:

- `/`
- `/pricing`
- `/auth`
- `/onboarding`
- `/invite/[token]`

Rules:

- public routes share one branded header and footer
- auth and invite flows should feel like the same product as the landing page
- pricing remains intentionally provisional while the MVP still exposes one wired Family monthly plan, but visible copy should read like a public product page rather than implementation notes; the pricing page now renders identity-specific cards behind a local Student, Parent, or Tutor selector
- the shell now carries the active UI language through shared dictionaries and a small client-side `document.documentElement.lang` sync instead of hardcoded French-only chrome
- the shared theme layer now defaults to the operating-system light or dark preference, but MVP chrome may expose one simple light-or-dark icon toggle when that improves usability without reopening the old preset/custom theme lab
- the landing route no longer shows the old floating helper button; first-time visitor entry points now live in the full-width landing navbar and role-specific CTAs
- the public chrome now uses a compact globe-menu language selector instead of always-visible inline language pills, and the control geometry must stay unclipped at small shell sizes
- the public shell no longer renders the subtitle under the wordmark on `/`, and the top bar now runs nearly the full landing width instead of staying on the narrower `6xl` rail
- the home route may opt out of the shared public footer when a page-owned closing CTA gives a cleaner public narrative than the heavier shell footer
- the auth route may also opt out of the shared public footer when a viewport-fit form layout is more important than repeating public narrative copy below the fold
- the home route now also uses a wider canvas with centered hero and closing CTA copy, while the product-story body alternates `1 preview + 3 glass cards` rows so future GIFs can scale without collapsing text legibility
- the current landing media frames now use neutral moving placeholder GIFs from public sources, stored locally in `public/landing/`, so the layout can be judged with real motion before actual product captures are ready
- the home and pricing routes now use a landing-specific full-width public header that hides on scroll down and returns on scroll up, without forcing that behavior onto auth, onboarding, or invite routes
- the home route hero is identity-aware through an instant client-side Student, Parent, or Tutor chooser; Parent is the default first view for the current revamp, Student feature content intentionally remains empty until its copy is written, and Tutor keeps the previous landing feature copy as placeholder content
- the landing-specific header uses the Student, Parent, or Tutor identity selector as its center control on `/`; pricing uses the same header chrome without a header-level audience selector because pricing owns its own local identity selector above the cards. Pricing also lives inside a compact `?` menu beside the theme toggle, alongside a temporary FAQ placeholder.
- pricing cards intentionally start without a large hero or follow-up explainer block: the page should show only the identity selector and the relevant plan cards. Student and Parent show `Explorer`, `Conqueror`, and `Lifetime`; Conqueror carries a monthly/yearly toggle inline with the price eyebrow and defaults to yearly. Explorer should carry the broadest visible free-plan feature list drawn from the landing story, while paid cards start their list with a check-mark row reading `All Explorer perks, plus:` before paid-specific benefits. Tutor remains a visibly unavailable selector with the same explanatory toast as the landing header, so future Tutor pricing cards named `Free`, `Herder`, and `Guru` stay defined in copy but are not displayed yet.
- pricing-card geometry should keep matching elements aligned across the row: the price/toggle row, plan title, body, feature list, and CTA all use fixed or shared grid rows so the Conqueror billing toggle does not change card height or push neighboring content out of alignment.
- the landing Tutor selector is temporarily unavailable while tutor accounts are still being implemented. It stays visibly unavailable, keeps a native hover title, and shows a short fixed-position toast that tells early users to contact the founder if they want early access without changing header height.
- the home route no longer shows the placeholder `banban workspace` hero mock. The top landing section stays focused on copy, role-specific CTA, and inline oversight links until real product media is ready.
- parent and tutor oversight links now sit inline at the end of the hero subtitle and open a large backdrop overlay that closes on outside click instead of using an in-page accordion.
- the landing hero is centered and no longer renders the role eyebrow above the headline.
- identity-specific landing feature sections now share the same default structure: centered section title, a large GIF/demo frame taking roughly two-thirds of the desktop row, and three adjacent feature cards taking the remaining third. The description stays in the section data for docs/copy context but is not rendered as a visible subtitle. Parent and Tutor use that template now; future Student copy should use the same section shape unless the landing brief changes.
- landing feature media accepts static images as well as GIFs. Parent feature 2 now uses a static dashboard overview asset at `public/landing/dashboard-overview.png`, while Parent features 3 and 4 reuse the conversation workspace asset at `public/landing/conversation-workspace.png`; replace those files with captured product screenshots when authenticated captures are available.
- the first Parent feature is an explicit exception from that default template: it uses a full-width centered title, two side-by-side comparison cards for generic AI versus banban, and a full-width demo GIF below them.
- landing feature sections alternate GIF/cards order on desktop so the media and copy rhythm does not become repetitive.
- the Student landing view does not render the closing `Start with banban.` CTA block while its dedicated feature copy remains unwritten.
- the landing route content and landing-specific header use doubled desktop side padding relative to the earlier landing shell so the viewport edge-to-content gap is visibly wider on large screens, while mobile and tablet padding keep the previous public-shell rhythm.
- the current landing revamp is wired for English, French, and Chinese across the hero, Parent feature sections, comparison cards, overlays, closing CTA, landing audience labels, help menu labels, and Tutor-unavailable toast. Student feature sections remain intentionally absent until dedicated Student landing content is written.
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
- profile/settings surfaces display the signed-in auth email as read-only account identity, while editable profile fields remain limited to display name, UI language, AI help language, and student age band
- the authenticated shell still shares the same theme bootstrap as the public shell, and now mirrors the public utility cluster with a simple light-or-dark toggle plus the language menu in the top header
- the authenticated header must use overflow-allowing variants on every ancestor class that clips by default when hover menus are mounted inside it; on the current shell header that means both `shell-panel--allow-overflow` and `page-glow--allow-overflow`
- the authenticated language control must update the saved app profile language, not just rewrite the URL query string used on public routes
- authenticated app routes may honor the short-lived `ia_ui_lang` cookie as an immediate UI-language override during the refresh triggered by the authenticated language menu, so the visible server-rendered copy can switch before the slower profile write fully completes
- the authenticated shell should not surface pilot badges, literal route hints, or other implementation-facing framing on the main role dashboards
- the student role now owns its own chat-first shell rhythm through `components/layout/student-app-shell.tsx`: collapsible left subject rail, minimal top bar, profile dock, and a quieter page canvas than the original generic `/app` chrome
- the student shell keeps a distinct `Dashboard` top entry, then carries five learner activity entries in the left rail: `Homework`/`Devoirs`, `Recap`, `Exams`/`Tests`, `Forward`/`Poursuivre`, and `Explore`/`Explorer`; only `Dashboard` and `Homework` are enabled today, while the others remain visible disabled placeholders until the pilot decides which tools deserve a full product surface
- disabled student-rail placeholders align their labels on the icon row and reserve a second description line that fades in only on hover; hover must not change row height or push neighboring rail items, and the future-tool cluster should stay tighter than the main navigation stack
- the student shell header now uses a simple eyebrow-and-title pattern instead of helper subtitles that describe the interface itself; on non-conversation student pages, that title lane matches the page body's centered workspace width, and on the live conversation route it is offset to line up with assistant reply text after the avatar column
- the left student rail no longer shows a divider under the wordmark block; its top strip should visually match the main-pane header height without introducing a second header rule
- the learner profile dock no longer shows a permanent outlined account section; the dock stays minimal by default, and the profile/settings/sign-out menu stays open while hovered with a short close grace period
- the student shell top strips are intentionally slimmer than the earlier MVP shell, and the utility/collapse icons should use the same smaller outline-free treatment instead of looking like a second layer of heavy controls
- the left rail keeps `Dashboard` as the top student entry, while the sidebar header itself keeps only the animated `bb` mark and collapse control
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
- the student shell now treats subjects as filter views over existing `subject_tag` values and uses `/app/settings` only for the minimal account surface, so the main `/app` page can behave more like a chat workspace than a control center
- `/app` now defaults to `view=dashboard`, which shows a wide Homework row with the left-rail Homework icon and subject links that wrap into natural-width rows, plus one row for the other student left-rail learning sections with matching icons and a second-row `Level up!` placeholder for future cross-subject practice; homework start/resume remains under `view=homework` and subject links keep `view=homework&subject=...`
- on the live student conversation route, the shell header now uses the subject as the eyebrow and shows the current conversation title on the second line; the first successful learner turn still attempts a dedicated AI title summary, but if that pass misses the server now applies a deterministic fallback title so the header should not remain stuck on `Subject_###` except during the very first pending round trip
- the subject rail keeps subject filters and counters, and each subject chevron can reveal up to the five most recent conversation titles for that subject with `...` when more exist; only one subject subsection is expanded at a time
- the homework block in the student rail keeps the Homework heading as the enabled learner entry. The old root Homework `+` affordance is removed; the expand/collapse chevron now occupies the same right action column as the per-subject chevrons, and dividers separate Homework from future tools and Tests from later exploratory placeholders.
- the profile dock now defaults to a minimal identity row with no outline, while settings and sign-out live in a hover/focus menu above it
- the subject quick-start now creates a bare conversation shell, uploads any staged files, sends the learner's first real message, and only then routes into `/app/conversations/[conversationId]`, so the main student view behaves more like a chat launcher than a wizard entry
- the student subject view and live conversation surface now both use a true right-side panel treatment instead of floating cards, so the workspace reads like a split main pane rather than a dashboard grid
- only the live conversation route keeps that right-side panel; the subject-selection view returns to a single main column until a real chat exists
- the live conversation route opts out of the authenticated shell's generic centered `max-w-7xl` content canvas so the workbench can fill the available main pane; keep breathing room as symmetric padding inside the chat article, and do not reintroduce negative right-margin or one-sided rail compensation because that creates duplicate gutters on the right side of the chat UI
- the globally reserved browser scrollbar gutter is disabled for live conversation routes, which use internal scroll areas; otherwise the browser can reserve an uninspectable right-edge strip even when no document-level scrollbar is visible
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
