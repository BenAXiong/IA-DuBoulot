# Frontend Foundations V1

Related: [README](../README.md) | [App shell V1](app_shell_v1.md) | [Student dashboard V1](student_dashboard_v1.md) | [Telemetry and feature controls V1](telemetry_feature_controls_v1.md) | [Service interfaces](service_interfaces.md) | [MVP to-do list](mvp_todo.md) | [Pilot_todo](pilot_todo.md)

## Purpose

This document defines the shared frontend foundation that was postponed while the core product slices were being built.

It closes the MVP-level expectations for:

- a small component primitive layer
- a reviewable shared brand layer for cards and shared shells
- repeatable form conventions
- explicit localization structure for `fr`, `en`, and `zh`
- lightweight formatting and modularity rules

## Component Primitive Layer

Current primitive location:

- `components/ui/action-button.tsx`
- `components/ui/form-callout.tsx`
- `components/ui/form-field.tsx`
- `components/ui/select-input.tsx`
- `components/ui/surface-card.tsx`
- `components/ui/text-input.tsx`

Rules:

- use `components/ui/` for small presentational primitives only
- keep primitives styling-first and domain-agnostic
- do not move fetch logic, auth decisions, or provider logic into primitives
- prefer adding a new narrow primitive over growing one catch-all component

Current adoption baseline:

- onboarding and account settings now use the shared input, select, button, and callout primitives
- parent approval and tutor invite forms use the same primitives
- dashboard and landing informational cards now reuse `SurfaceCard`

## Brand And Shell Foundation

Shared shell-brand iteration now lives in:

- `app/layout.tsx`
- `app/globals.css`
- `components/theme/theme-script.tsx`
- `components/theme/theme-toggle.tsx`
- `lib/theme/config.ts`
- `components/layout/public-shell.tsx`
- `components/layout/app-shell.tsx`

Rules:

- push color, typography, shell chrome, and motion changes into shared tokens or shared shell classes first
- keep preset and custom theme behavior in the shared theme layer instead of duplicating page-local color variants
- use `SurfaceCard` and the shared shell classes before adding page-local decorative wrappers
- for dropdowns, popovers, and hover menus, inspect the clipping ancestor and the winning computed `overflow` or stacking rule before changing the child component; if escape from the shell is required, choose a portal or an explicit overflow-allowing shell variant instead of retrying `z-index` patches on the menu itself
- keep the tone calm, reassuring, and low-noise on both student and adult surfaces
- keep subtle motion such as CTA background drift in shared token or primitive classes, not in page-local one-off effects
- reserve route-by-route redesign work for [Pilot_todo](pilot_todo.md) once a concrete UX problem is identified

Current MVP boundary:

- the repo now has one branded baseline for shared shells and cards
- the repo now also has a shared multi-theme bootstrap plus public or authenticated shell controls, including `light`, a ChatGPT-like inferred `dark`, the current `smooth` dark preset, a warmer `warm` preset, and a saved `custom` variant that overrides the shared global tokens
- the shared primary CTA now carries a slow gradient drift by default, with reduced-motion fallback still handled at the global CSS layer
- the auth route now uses a viewport-fit layout with the heavier informational rail kept to desktop widths, so the page does not depend on stacked marketing copy or the shared footer to explain itself on smaller screens
- deeper route redesign, flow experimentation, and broader UX polishing belong to the pilot lane

## Form Conventions

Preferred structure:

1. local state and submission logic stay in the form component
2. field wrappers use `FormField`
3. inline validation messages stay field-local
4. route-level failure and success messages use `FormCallout`
5. submit and secondary actions use `ActionButton`

Rules:

- keep business validation on the server
- client validation may improve UX, but cannot replace route validation
- preserve the canonical API error envelope from [error_audit_conventions.md](error_audit_conventions.md)
- do not duplicate per-form styling strings when a primitive already fits

## Localization Structure

Shared localization code now lives in:

- `lib/i18n/config.ts`
- `lib/i18n/ui-copy.ts`
- `lib/i18n/dashboard-copy.ts`
- `lib/i18n/student-flow-copy.ts`
- `lib/i18n/oversight-copy.ts`
- `lib/i18n/ui-language.ts`
- `components/i18n/document-language-sync.tsx`

It currently owns:

- supported UI language codes
- supported AI-help language codes
- UI language labels
- locale mapping for `Intl` formatting
- shared student age-band option lists
- shared route or surface dictionaries for public, auth, invite, shell, and settings copy
- student intake, history, workbench, and summary route dictionaries
- parent or tutor detail, review, notes, and billing dictionaries
- public-route helpers that preserve `lang` across links and redirects
- a small client-side document-language sync for the shared shells

Rules:

- keep locale metadata in `lib/i18n/`, not inline in domain components
- keep business rules independent from translated copy
- prefer passing `UiLanguageCode` into presenters over hardcoding `fr-FR`, `en-US`, or `zh-TW`
- do not import server-only auth modules just to reach locale constants

Current MVP boundary:

- landing, pricing, auth, onboarding, invite acceptance, shared shell chrome, app-home account card, and settings/privacy now consume the shared dictionaries
- the role dashboards on `/app` now also consume the shared dashboard dictionaries and localized presenters
- the student intake, history, workbench, linked-student detail, adult review, admin audit list, and deletion-request feedback now also consume dedicated copy modules or localized shared helpers, with the core student APIs also resolving their user-facing validation, upload, fallback, and summary text through `lib/i18n/student-flow-copy.ts`
- auth/profile, invitation create/accept, tutor-note mutations, memory mutations, and the current parent billing-management conflict path now also resolve user-facing server messages through focused copy modules instead of hardcoded French strings
- the shared Next font setup now carries explicit CJK fallback so `zh` headings do not depend on accidental glyph support from the Latin-first font choice
- the remaining launch-blocking trilingual gap is now mostly the broader accented-French or Unicode audit, parent-summary default and language-switch verification, and residual generic provider or service strings that still live outside the focused copy modules

## Formatting And Modularity Rules

Formatting baseline:

- `.editorconfig` is now committed as the repository formatting floor
- ESLint remains the canonical automated lint entry point

Current enforced lint rule:

- application code cannot use raw `console.*`; runtime logging stays centralized in `lib/server/audit/runtime-logger.ts`

Modularity rules:

- move shared presentational styling into `components/ui/`
- keep route handlers thin and service-owned
- split a component or service when it starts mixing layout, mutations, orchestration, and policy logic
- prefer server/service modules over client-side policy branches

This is intentionally a lightweight MVP foundation, not a full design-system program.
