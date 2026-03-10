# App Shell V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [API route map](api_route_map.md) | [Invitation flows V1](invitation_flows_v1.md) | [Service interfaces](service_interfaces.md)

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
- pricing remains intentionally provisional until Lemon Squeezy is wired

## Authenticated App Shell

Code:

- `app/app/layout.tsx`
- `components/layout/app-shell.tsx`

Current route using it:

- `/app`

Rules:

- the shell owns responsive navigation and session chrome
- page content under `/app` should focus on role-specific panels, not duplicate nav/header code
- the shell is role-aware, but not role-bloated: role-specific content lives in dashboard modules, not inside the chrome component

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

The authenticated shell currently uses same-page anchors for the first pass:

- `#overview`
- `#actions`
- `#students`
- `#links`
- `#operations`
- `#account`

Why:

- real sub-routes for sessions, billing, notes, and student lists do not exist yet
- anchor navigation still gives the shell a stable structure without inventing fake routes

## iPad Intent

The shell is designed for:

- stacked content and horizontal nav below `lg`
- sidebar navigation from `lg` upward
- card grids that expand from 1 to 2 to 3 columns across breakpoints

Important:

- this is implementation intent, not a recorded manual device validation yet
- `A2.3.4` remains open until the shell is checked explicitly on iPad portrait and landscape widths

## Known Follow-Ups

- convert anchor sections into real route destinations as dashboards grow
- add localized copy structure instead of hardcoded strings
- validate the shell on actual iPad portrait and landscape widths
- add role-specific empty states that consume real data rather than static MVP guidance copy
