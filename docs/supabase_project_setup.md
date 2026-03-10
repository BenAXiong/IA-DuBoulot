# Supabase Project Setup Notes

Related: [README](../README.md) | [Environment matrix](environment_matrix.md) | [Invitation flows V1](invitation_flows_v1.md) | [Storage and attachment rules](storage_attachment_rules.md) | [Minors privacy baseline](minors_privacy_baseline.md) | [Supabase schema V1](supabase_schema_v1.md)

## Recommended Project Settings

These are the settings worth paying attention to for the first Supabase project.

Current project URL:

- `https://dfiiujkhbuvltrlqrerd.supabase.co`

### 1. Region

- pick the region closest to the expected first real users
- if the initial testers are mostly in Taiwan or East Asia, choose the nearest supported region there
- if the first serious families are in Europe, choose the nearest European region instead

Changing region later is possible, but it is avoidable migration work.

### 2. Auth URL Configuration

- set `SITE_URL` to the production Vercel URL once the domain is stable
- add local development redirect URLs for `http://localhost:3000/*`
- add Vercel preview redirect URLs if auth flows need preview deployments
- use one hostname consistently during local browser auth testing; `localhost` and `127.0.0.1` do not share cookies

This matters because Supabase auth emails and OTP flows redirect to the configured site and redirect URLs.

### 3. Email Confirmation

- keep confirm email enabled for MVP
- this matches the parent-linked and under-13 cautious posture already documented in the repo

### 4. Phone Auth

- keep phone auth off for MVP
- email-based flows are simpler and fit the current product plan

### 5. Storage

- create private buckets, not public ones, for homework files
- use the bucket plan in [storage_attachment_rules.md](storage_attachment_rules.md)
- set bucket MIME restrictions and file-size limits when the upload slice is built

### 6. Database Security

- there is no single project-wide RLS switch that fixes all future tables
- RLS is enforced per table
- dashboard-created tables often enable RLS automatically
- raw SQL tables do not necessarily do that, so we enable RLS directly in the migration
- if you did not check an RLS-related box during project setup, that does not break the project; it just means table-level RLS must still be handled explicitly

### 7. Immediate Next Steps In The Supabase Dashboard

1. Open `Project Settings` -> `API` or the `Connect` dialog.
2. Copy:
- project URL
- publishable key or anon key
- service-role or secret key for backend-only use
3. Put them in local `.env.local`.
4. Mirror the same values into Vercel environment variables.
5. Keep the service-role or secret key server-only; never expose it in browser code.
6. Run the next pending SQL migration:
- [20260311_000003_account_link_invitations.sql](../supabase/migrations/20260311_000003_account_link_invitations.sql)

### 8. Next.js Auth Integration

- when auth wiring starts, use the Supabase SSR path for Next.js instead of old auth helpers
- that is the current Supabase direction for server-side auth with cookies
- if email confirmation is enabled, wire the project through the repo's `/auth/confirm` route and update the Supabase confirm-signup email template to use `token_hash` + `type=email` instead of relying on the older client-side confirmation flow
- the current baseline confirm-signup template is valid for generic signup confirmation
- same-browser invite recovery is now handled by the pending-invite cookie plus `/auth/complete`, even when the email template does not preserve `next`
- cross-browser or cross-device invite recovery still requires reopening the original `/invite/[token]` link

## Official References

- RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Next.js auth quickstart: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- SSR auth: https://supabase.com/docs/guides/auth/server-side/oauth-with-pkce-flow-for-ssr
- Server-side email confirmation guide: https://supabase.com/docs/guides/auth/server-side/nextjs
- Redirect and site URL behavior: https://supabase.com/docs/client/auth-signup
- Storage bucket restrictions: https://supabase.com/docs/guides/storage/buckets/creating-buckets
