# Frontend Foundations V1

Related: [README](../README.md) | [App shell V1](app_shell_v1.md) | [Student dashboard V1](student_dashboard_v1.md) | [Telemetry and feature controls V1](telemetry_feature_controls_v1.md) | [Service interfaces](service_interfaces.md) | [MVP to-do list](mvp_todo.md)

## Purpose

This document defines the shared frontend foundation that was postponed while the core product slices were being built.

It closes the MVP-level expectations for:

- a small component primitive layer
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

Shared localization configuration now lives in `lib/i18n/config.ts`.

It currently owns:

- supported UI language codes
- supported AI-help language codes
- UI language labels
- locale mapping for `Intl` formatting
- shared student age-band option lists

Rules:

- keep locale metadata in `lib/i18n/`, not inline in domain components
- keep business rules independent from translated copy
- prefer passing `UiLanguageCode` into presenters over hardcoding `fr-FR`, `en-US`, or `zh-TW`
- do not import server-only auth modules just to reach locale constants

Current MVP boundary:

- the product still ships mostly French copy
- this slice establishes the shared locale structure without attempting a full translation pass

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
