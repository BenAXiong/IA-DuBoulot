# Minors Privacy Baseline

Related: [README](../README.md) | [Implementation plan](implementation_plan.md) | [MVP to-do list](mvp_todo.md) | [Decision log](decision_log.md)

Status: chosen MVP product-policy baseline for planning and implementation. This is not legal advice. It is the default operating policy the codebase should be built around unless later replaced by lawyer-reviewed requirements.

## Goal

Remove avoidable ambiguity now so auth, schema, storage, AI, and settings are designed around a coherent under-13 policy instead of patched later.

## Conservative Product Posture

IA DuBoulot should be treated as a child-relevant product from day one, not as an adult product that only later discovers children are using it.

That means the MVP should choose the conservative path:

- minimize child data collection
- require parent involvement for under-13 use
- make deletion feasible in-product
- keep third-party data flow explicit
- avoid relying on weak assumptions about provider free tiers

## Chosen Defaults For MVP

### 1. Account Model For Under-13 Users

Chosen default:

- under-13 students do not create normal self-serve accounts on their own
- a parent or guardian creates the parent account first
- the parent creates or approves the child profile
- the child accesses the product only after parent linking is complete

Engineering consequence:

- account state should support `pending_parent_approval`, `active`, and `deletion_requested`
- parent-student linking is not optional for under-13 accounts
- because the current product still maps each learner directly to `auth.users`, the first parent-created path may need interim learner credentials before a later managed-profile/claim redesign exists cleanly

Reason:

- this is the cleanest MVP path that reduces compliance and access-control ambiguity

### 2. Consent Workflow

Chosen default:

- for MVP, under-13 access is limited to parent-created or parent-approved accounts in supervised pilot mode
- if a child attempts signup directly and indicates they are under 13, capture only the minimum needed to contact the parent
- send the parent notice and hold the child account in a pending state
- if parent approval is not completed within 7 days, delete the pending record

What is stored during pending consent:

- parent email
- child nickname or placeholder
- age band
- consent-status timestamps

What is not stored before approval:

- homework uploads
- chats
- memory profile
- tutor notes

Reason:

- it keeps the implementation compatible with a stricter consent flow later without forcing a heavy legal/ops system on day one

### 3. Age Collection

Chosen default:

- collect age band, not full date of birth, wherever possible
- recommended bands: `6-8`, `9-10`, `11-12`, `13-15`, `16-18`
- for under-13 gating, use the age-band choice to trigger parent-linking rules

Reason:

- age band is enough for UI, prompt tone, and gating without collecting unnecessary exact birth data

Alternative not chosen:

- exact birth date

Why not:

- it adds sensitive data with little MVP benefit

### 4. Parent Rights In Product

Chosen default:

- parents can review the child's sessions and summaries
- parents can see linked tutors
- parents can request deletion of the child's account data from settings
- parents can revoke tutor access
- parents can see what data categories are stored

MVP compromise:

- export can be support-assisted at MVP if self-serve export would slow delivery

Reason:

- review and deletion are core rights; export can be implemented later if needed

### 5. Tutor Rules For Under-13 Accounts

Chosen default:

- tutors cannot directly create or activate under-13 student accounts without parent linkage
- tutors may be linked only after parent approval
- tutor notes remain private from the student but visible to authorized adults or admins if policy later requires it

Reason:

- parent oversight must stay primary for child accounts

### 6. Data Minimization

Collect only:

- display name or nickname
- age band
- language preference
- role and linked-account relationships
- homework uploads
- extracted text
- session chats
- session summaries
- workspace state
- tutor notes
- memory items limited to educational relevance
- usage counters
- audit logs for sensitive access

Do not collect by default:

- precise birth date
- home address
- precise school name
- phone number for child accounts
- advertising identifiers
- child profile photos
- sensitive health or psychological labels
- free-form private family background unless truly required for support

Engineering consequence:

- uploads should have metadata stripped where feasible
- forms should avoid fields that invite unnecessary sensitive data

### 7. Third-Party Provider Policy

Chosen default:

- use only the minimum providers required for MVP: Supabase, Gemini, PostHog, Resend, Lemon Squeezy
- do not send child data to a provider unless it is needed for the feature to work
- do not assume any provider free tier is acceptable for live child data
- for live under-13 usage, use production provider settings/tiers that are acceptable for minors

Specific rule for analytics:

- student analytics should be minimal
- avoid capturing raw homework content in analytics
- if PostHog is used on student surfaces, restrict events to product usage metadata, not child content

Specific rule for AI:

- send only the content needed for the homework task
- avoid sending unnecessary account metadata to the model
- prefer server-side prompt assembly so data flow stays auditable

### 8. Retention Windows

Chosen default:

- pending-consent records: delete after 7 days if parent approval does not complete
- active uploads and extracted text: keep while the account is active, but delete immediately if the related session or account is deleted
- inactive child account content: auto-review at 180 days of inactivity, then queue for deletion unless the parent keeps the account active
- memory items: expire or require refresh after 180 days if they are no longer educationally relevant
- audit logs for sensitive access: retain for 12 months
- billing records: retain only as needed for billing/tax operations and keep them logically separate from child learning content
- backups: allow an operational backup window up to 35 days

Reason:

- this is a practical school-year-friendly balance without defaulting to indefinite storage

### 9. Deletion Workflow

Chosen default:

- parents can request deletion from settings
- deletion should immediately disable access and queue data purge work
- live product data should be removed promptly
- full purge target for child learning content is within 30 days, excluding temporary backup retention and strictly necessary billing/security records

Data categories to delete:

- uploads
- extracted text
- conversations and messages
- workspace states
- summaries
- tutor notes tied to the child
- memory items
- parent-student and tutor-student links where appropriate

Data categories that may remain temporarily:

- limited billing records
- security and abuse-review records
- operational backups during the backup retention window

### 10. Review And Disclosure

Chosen default:

- settings/privacy screens must explain what is stored and why
- parent linking screens must explain adult visibility and deletion controls
- the product should avoid vague claims like "we keep your data safe" without concrete controls

## Alternatives Considered

### Alternative A: Block Under-13 Users Entirely Until Later

Pros:

- lowest compliance risk

Why not chosen:

- it conflicts with the product goal and likely first-user base

### Alternative B: Allow Full Under-13 Self-Serve Signup

Pros:

- lowest onboarding friction

Why not chosen:

- too risky for MVP and hard to defend operationally

Current implementation note:

- the product now supports both the original learner-created plus parent-approval flow and an additive parent-created learner-account flow from the parent workspace
- the parent-created path is intentionally narrow for Pilot: it creates a real learner auth account with parent-chosen initial credentials, rather than a profile-only learner record
- a later managed-profile plus learner-claim flow may still be preferable if parent-led usage becomes the dominant path

### Alternative C: Collect Exact Birth Date

Pros:

- precise gating

Why not chosen:

- unnecessary sensitive data for MVP

### Alternative D: Store Child Data Indefinitely Until Manual Deletion

Pros:

- easiest to implement

Why not chosen:

- weak privacy posture and likely to create long-term liability

### Alternative E: Treat A Personal AI Subscription As Fallback Infrastructure

Pros:

- no immediate API cost

Why not chosen:

- not a stable deployable backend dependency
- unclear rate-limit and terms posture
- poor traceability and operational resilience

## Architecture Consequences

The baseline above requires:

- explicit parent-student linking tables
- account states for pending approval and deletion requested
- deletion jobs that can clean both database rows and storage objects
- provider abstraction with documented data flow
- audit logging for sensitive access
- settings screens for parent review and deletion actions
- prompt assembly and provider calls happening server-side
- analytics designed to avoid child-content capture

## Remaining Open Questions

These no longer block architecture, but they still need final review before launch:

1. Whether parent approval should stay in-product only or add a stronger manual verification step for the first pilot.
2. Whether support-assisted export is enough for MVP.
3. Exact wording for parent notice, consent, and deletion copy.
4. Exact tax and billing-retention obligations that Lemon Squeezy may impose.
5. Whether inactive-account auto-deletion should happen automatically at 180 days or only after parent reminder notice.

## External Baseline Reference

For the U.S. baseline, start with the FTC COPPA FAQ:

- https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
