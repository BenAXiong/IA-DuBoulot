# Minors Privacy Baseline

Related: [README](../README.md) | [Implementation plan](implementation_plan.md) | [MVP to-do list](mvp_todo.md) | [Decision log](decision_log.md)

Status: provisional implementation baseline for MVP planning. This is not legal advice. It is the minimum policy baseline needed so the product architecture does not get designed blindly.

## Why This Must Be Addressed Early

Because IA DuBoulot is intended for school-age users, including children under 13, privacy and deletion rules affect:

- signup and linking flows
- role permissions
- what data is stored at all
- what providers can receive
- what must be deletable
- what must be auditable

If these rules are left vague until late in the build, auth, schema, prompts, storage, and settings screens will all need rework.

## Provisional MVP Baseline

### 1. Under-13 Access

- No fully independent self-serve under-13 student account.
- Under-13 student access should require a linked parent or guardian account before normal usage.
- Parent-linked approval should be part of the account activation flow, not an optional later step.

### 2. Data Minimization

Collect only what the MVP actually needs:

- display name or nickname
- role and linked-account relationships
- language preference
- school level or age band
- homework uploads
- extracted text
- session chats
- session summaries
- tutor notes
- student memory items limited to educational relevance
- audit logs for sensitive access

Avoid collecting by default:

- precise birth date if age band is sufficient
- home address
- precise school identity unless truly necessary later
- phone number for child accounts
- advertising identifiers
- unnecessary behavioral profiling
- sensitive health or psychological labels

### 3. Provider Handling

- Prefer providers and settings that do not use child data for provider-side model training or unrelated product improvement.
- Track which third-party services receive student content: Supabase, Gemini, PostHog, Resend, Lemon Squeezy.
- Keep provider use documented in user-facing privacy copy and internal implementation docs.

### 4. Parent Rights In Product

Parents or guardians should be able to:

- review the child's sessions and summaries
- view what data categories are stored
- request deletion of the child's account data
- understand what third-party services are involved

Export can be added after MVP if necessary, but review and deletion need to be planned now.

### 5. Retention Baseline

Recommended provisional retention rules for planning:

- active accounts: retain core homework history while the account remains active
- parent-requested deletion: remove child-facing and learning-content data from the live product promptly, with full purge targeted within 30 days except where a short retention window is needed for billing, abuse prevention, or backups
- inactive accounts: define a later auto-review or auto-purge policy before launch rather than storing indefinitely by accident
- audit logs: retain only what is necessary for access/security review and document the reason

These values should be confirmed before launch, but the product should be built so retention windows can be configured without redesigning the schema.

### 6. Deletion Baseline

The system should support deletion of:

- uploads and extracted text
- conversations and messages
- summaries
- tutor notes tied to the child
- memory items
- linked-account relationship records where appropriate

The system may need to retain limited records temporarily for:

- billing reconciliation
- fraud or abuse investigation
- operational backups

Any such retained category should be explicitly listed later in privacy copy, not left implicit.

## Architecture Consequences

To support the baseline above, implementation should include:

- clear parent-student linking tables
- explicit deletion workflows
- storage references that allow attachment cleanup
- audit logs for sensitive views
- provider abstraction and documented data flow
- settings screens that expose data control actions

## What Still Needs Founder Confirmation

These are still open and should be answered before launch:

1. Exact parent-consent workflow for under-13 students.
2. Whether tutors can invite students directly or only through parents.
3. Final retention windows for inactive accounts, uploads, chats, notes, and audit logs.
4. What data export capability is needed at MVP versus post-MVP.
5. Exact privacy and consent copy to show during signup and linking.

## External Baseline Reference

For the U.S. baseline, start with the FTC COPPA FAQ:

- https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
