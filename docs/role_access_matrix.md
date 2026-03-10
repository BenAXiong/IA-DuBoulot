# Role And Access Matrix

Related: [README](../README.md) | [Implementation plan](implementation_plan.md) | [Minors privacy baseline](minors_privacy_baseline.md) | [MVP to-do list](mvp_todo.md) | [Decision log](decision_log.md)

## Core Rules

- Student data belongs to the student workflow, but under-13 access is parent-linked by default.
- Parent access exists only through explicit parent-student links.
- Tutor access exists only through explicit tutor-student links.
- Admin access is exceptional and should be audited.
- Tutor private notes are never visible to the student.
- Parent access to tutor private notes is `none` by default in MVP.

## Resource Matrix

| Resource | Student | Parent | Tutor | Admin | Notes |
| --- | --- | --- | --- | --- | --- |
| Own account profile | read/update own | read/update own | read/update own | manage all, audited | Account settings remain role-scoped |
| Student profile basics | read own, limited update | read linked child, limited update | read linked child | manage all, audited | Includes language, age band, linked status |
| Parent-student links | read own links | create/revoke linked child access | none | manage all, audited | Under-13 requires parent link |
| Tutor-student links | request/view own links | approve/revoke for linked child | request/view own links | manage all, audited | Parent approval required for under-13 |
| Conversations and messages | create/read/update own | read linked child | read linked child | read/manage, audited | No parent/tutor editing of student chat |
| Attachments and extracted text | upload/read/delete own session files | read linked child | read linked child | read/manage, audited | Storage cleanup must follow deletion rules |
| Workspace state | create/read/update own | read linked child | read linked child | read/manage, audited | Parent/tutor are review-only |
| Session summaries | read own | read linked child | read linked child | read/manage, audited | Summary variants may differ by role |
| Student memory items | read own relevant items | read linked child | read linked child summary signals | read/manage, audited | System-generated; user edits are limited |
| Tutor private notes | none | none | create/read/update own linked notes | read/manage, audited | Hidden from student and parent in MVP |
| Billing and subscription | none | read/update own payer billing | none | read/manage, audited | Billing belongs to the paying adult |
| Privacy and deletion controls | request own deletion if policy allows | request/delete linked child data | none | execute/manage, audited | Under-13 deletion is parent-controlled |
| Audit logs and moderation events | none | none | none | read/manage | Sensitive operational surface only |

## Under-13 Overrides

- under-13 students do not activate without parent linkage
- tutors do not gain access without parent approval
- under-13 deletion requests are parent-controlled
- pending-consent records keep only minimal data and auto-delete after 7 days if approval never completes

## Implementation Notes

- Enforce the matrix in both RLS and server-side authorization.
- Audit parent, tutor, and admin reads of student data that are sensitive or privacy-relevant.
- Keep access checks explicit in code. Do not bury them in UI-only assumptions.
