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
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase | browser and server client bootstrap | local `.env.local`, Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase | browser and server client bootstrap | local `.env.local`, Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Supabase | admin jobs, secure server actions, audit writes, profile bootstrap repair | local `.env.local`, Vercel |
| `GEMINI_API_KEY` | server | Google Gemini | AI provider calls | local `.env.local`, Vercel |
| `NEXT_PUBLIC_POSTHOG_KEY` | public | PostHog | product analytics | local `.env.local`, Vercel |
| `NEXT_PUBLIC_POSTHOG_HOST` | public | PostHog | product analytics host | local `.env.local`, Vercel |
| `RESEND_API_KEY` | server | Resend | transactional email | local `.env.local`, Vercel |
| `LEMON_SQUEEZY_API_KEY` | server | Lemon Squeezy | billing API calls | local `.env.local`, Vercel |
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | server | Lemon Squeezy | webhook verification | local `.env.local`, Vercel |
| `SUPABASE_FIXTURE_PASSWORD` | local-only | local operator secret | deterministic hosted RLS fixture seed/verify scripts | local `.env.local` only |

## Storage Constants

- storage bucket names are not environment variables in MVP
- use stable bucket names across environments and document them in [storage_attachment_rules.md](storage_attachment_rules.md)
- if this changes later, update this file before adding storage bucket env vars to code

## Current Gaps

- confirm Vercel environment sync after Supabase integration changes
- planned storage buckets are now created automatically by the fixture seed script, but production upload flows still need route-level enforcement
- Gemini key still needs to be provisioned
- PostHog and Resend values still need to be provisioned
- Lemon Squeezy webhook secret arrives only after webhook setup
