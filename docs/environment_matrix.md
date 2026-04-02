# Environment Matrix

Related: [README](../README.md) | [Implementation plan](implementation_plan.md) | [Storage and attachment rules](storage_attachment_rules.md) | [MVP to-do list](mvp_todo.md) | [Decision log](decision_log.md)

## Goal

Keep environment configuration explicit so local development, Vercel, and provider setup do not drift.

## Rules

- commit `.env.example`, never real secrets
- keep live secrets in Vercel project settings and local `.env.local`
- add a new variable here before using it in code

## Variables

| Variable | Scope | Provider | Required for | Where it lives |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | public | app | canonical app URL | local `.env.local`, Vercel |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | public | app | enable browser telemetry hooks and the server telemetry sink | local `.env.local`, Vercel |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase | browser and server client bootstrap | local `.env.local`, Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase | browser and server client bootstrap | local `.env.local`, Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Supabase | admin jobs, secure server actions, audit writes, profile bootstrap repair | local `.env.local`, Vercel |
| `GEMINI_API_KEY` | server | Google Gemini | AI provider calls | local `.env.local`, Vercel |
| `OPENAI_API_KEY` | server | OpenAI | future fallback AI provider adapter | local `.env.local`, Vercel |
| `ENABLE_OPENAI_FALLBACK` | server | app | explicit toggle for a future OpenAI fallback adapter | local `.env.local`, Vercel |
| `NEXT_PUBLIC_POSTHOG_KEY` | public | PostHog | product analytics | local `.env.local`, Vercel |
| `NEXT_PUBLIC_POSTHOG_HOST` | public | PostHog | product analytics host | local `.env.local`, Vercel |
| `RESEND_API_KEY` | server | Resend | transactional email | local `.env.local`, Vercel |
| `ENABLE_RESEND_EMAILS` | server | app | explicit toggle for future Resend-backed send flows | local `.env.local`, Vercel |
| `ENABLE_PARENT_AI_ACTIONS` | server | app | explicit toggle for future parent-initiated AI surfaces | local `.env.local`, Vercel |
| `LEMON_SQUEEZY_API_KEY` | server | Lemon Squeezy | billing API calls | local `.env.local`, Vercel |
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | server | Lemon Squeezy | webhook verification | local `.env.local`, Vercel |
| `LEMON_SQUEEZY_STORE_ID` | server | Lemon Squeezy | checkout creation store target | local `.env.local`, Vercel |
| `LEMON_SQUEEZY_VARIANT_ID_FAMILY_MONTHLY` | server | Lemon Squeezy | Family checkout variant mapping | local `.env.local`, Vercel |
| `LEMON_SQUEEZY_TEST_MODE` | server | Lemon Squeezy | optional checkout test-mode toggle | local `.env.local`, Vercel |
| `SUPABASE_FIXTURE_PASSWORD` | local-only | local operator secret | deterministic hosted RLS fixture seed/verify scripts | local `.env.local` only |

## Storage Constants

- storage bucket names are not environment variables in MVP
- use stable bucket names across environments and document them in [storage_attachment_rules.md](storage_attachment_rules.md)
- if this changes later, update this file before adding storage bucket env vars to code

## Current Gaps

- confirm Vercel environment sync after Supabase integration changes
- planned storage buckets are now created automatically by the fixture seed script, and the upload route family now exists locally, but deployed route-level verification still needs a targeted smoke pass
- `GEMINI_API_KEY` is now present both locally and on the linked Vercel production project as of 2026-04-02, but Gemini free-tier RPM and RPD limits still apply per Google project rather than per API key; use a separate dev project for local work and provision a dedicated billed pilot project before real user traffic
- local PostHog provisioning is now present through `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, and `NEXT_PUBLIC_ENABLE_ANALYTICS`; confirm Vercel parity and keep the sink runtime-only until the real PostHog adapter exists
- local `RESEND_API_KEY` is now present, but sender/domain setup and `ENABLE_RESEND_EMAILS` remain off, so Resend-backed delivery is still externally blocked
- the current repo still has no Resend mailer path; invitation flows return copy/share URLs today, so enabling `ENABLE_RESEND_EMAILS` alone will not send transactional email
- Lemon Squeezy is now verified in deployed production with `LEMON_SQUEEZY_TEST_MODE=true`; the remaining billing follow-up is a later live-mode cutover, not missing MVP wiring
- OpenAI is now the chosen fallback provider, but the adapter remains intentionally disabled until implemented and provisioned

## Lemon Squeezy Provisioning Names

For the current MVP billing slice, these are the exact Lemon Squeezy values the repo expects you to provide:

| Lemon Squeezy info name | Repo variable | Notes |
| --- | --- | --- |
| `API key` | `LEMON_SQUEEZY_API_KEY` | server-side secret used for checkout creation and portal lookups |
| `Store ID` | `LEMON_SQUEEZY_STORE_ID` | the Lemon store that owns the checkout |
| `Variant ID` for the `Family` monthly plan | `LEMON_SQUEEZY_VARIANT_ID_FAMILY_MONTHLY` | the single paid MVP plan currently wired in code |
| `Signing secret` from the Lemon webhook config | `LEMON_SQUEEZY_WEBHOOK_SECRET` | required for `POST /api/billing/webhooks/lemonsqueezy` signature verification |
| `Test mode` choice | `LEMON_SQUEEZY_TEST_MODE` | set to `true` or `false`; defaults to `false` in `.env.example` |

Current MVP note:

- the code does not currently require a separate Lemon `Product ID`
- the code does not currently require a separate Lemon `Webhook URL` env var because the app route is fixed at `/api/billing/webhooks/lemonsqueezy`
- if the Family offer later gains yearly or alternate variants, add new env vars here before wiring them in code
