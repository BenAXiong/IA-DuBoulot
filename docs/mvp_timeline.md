# MVP Timeline

Related: [README](../README.md) | [Implementation plan](implementation_plan.md) | [MVP to-do list](mvp_todo.md)

## Recommended Schedule

Assuming implementation begins immediately after this planning pass and runs at roughly full-time founder-plus-Codex throughput, the realistic target is:

- Internal MVP target: 2026-04-24
- Launch-candidate buffer week: 2026-04-27 to 2026-05-01
- More realistic part-time target: late May 2026 to early June 2026

That makes this a roughly 7-week full-time-equivalent MVP, or about 10 to 12 calendar weeks if the work is done part-time.

## Current Checkpoint

As of 2026-03-11:

- phases `A1`, `A3`, `A4`, `A5`, and `A6` are now complete in the local workspace
- `A7.2` is now complete through the written smoke checklist, the aggregated regression pass, and the existing automated smoke scripts
- `A7.3` is now complete through AI request caps, artifact-reuse guardrails, and the upload-economics review
- `A7.4` is now complete through the founder walkthrough, launch checklist, scope freeze, and explicit PWA deferral
- the next active product work inside `A7` is now `A7.1` manual iPad Safari validation plus the newly-added `A7.3.4` AI ops/economics documentation and policy follow-up
- `A0` and `A2` still contain governance and app-foundation follow-ups, but they are no longer the critical path for the current MVP slice

## Week-By-Week Plan

### Week 0: 2026-03-11 to 2026-03-13

Focus:

- complete Phase `A0.1` to `A0.4`
- lock naming, repo, deployment, service-account, and privacy-baseline decisions
- turn the plan into executable technical artifacts

Exit criteria:

- GitHub repo exists
- deployment target exists
- provider decisions are unblocked enough to code
- role matrix and acceptance criteria exist

### Week 1: 2026-03-16 to 2026-03-20

Focus:

- complete Phase `A1.1` to `A1.3`
- draft SQL schema
- write route map
- define provider/service interfaces
- define storage and audit conventions

Exit criteria:

- schema, RLS plan, and route map are stable enough to scaffold against

### Week 2: 2026-03-23 to 2026-03-27

Focus:

- complete Phase `A1.4` and `A2.1` to `A2.4`
- scaffold the app
- connect auth
- build the shared shell
- add telemetry basics

Exit criteria:

- a user can authenticate into the shell
- seeded accounts exist
- role-aware layout is running

### Week 3: 2026-03-30 to 2026-04-03

Focus:

- complete Phase `A3.1` to `A3.3`
- build the student dashboard
- build new homework intake
- persist conversations and attachments

Exit criteria:

- a student can create and reopen a homework session

### Week 4: 2026-04-06 to 2026-04-10

Focus:

- complete Phase `A3.4`, `A3.5`, and `A4.1` to `A4.3`
- finish chat and workspace
- implement extraction
- add the AI provider layer

Exit criteria:

- the full student intake-to-chat flow works with real files

### Week 5: 2026-04-13 to 2026-04-17

Focus:

- complete Phase `A4.4`, `A4.5`, and `A5.1` to `A5.3`
- add moderation and coach rules
- generate summaries
- build parent and tutor review surfaces

Exit criteria:

- linked adults can review the student's work without data leaks

### Week 6: 2026-04-20 to 2026-04-24

Focus:

- complete Phase `A5.4` and `A6.1` to `A6.4`
- add audit logs
- add memory profile behavior
- add quotas, trial behavior, billing abstraction, and privacy controls

Exit criteria:

- the MVP business and privacy skeleton is present

### Week 7: 2026-04-27 to 2026-05-01

Focus:

- complete Phase `A7.1` to `A7.4`
- iPad polish
- smoke tests
- cost guardrails
- launch candidate prep

Exit criteria:

- the app is demoable, traceable, and safe enough for controlled beta use

## Critical Path

The schedule only holds if these stay unblocked:

1. GitHub, deployment, Supabase, and provider accounts are created in Week 0.
2. The role matrix and schema are settled before heavy UI work.
3. Upload extraction is tested with real homework artifacts by Week 4.
4. Billing provider uncertainty does not leak into the rest of the architecture.
5. iPad QA starts before the last week, not only during final polish.

## Likely Slip Points

- delayed billing/provider decisions
- underestimating RLS and linking complexity
- unreliable upload extraction on real homework data
- scope creep on parent/tutor dashboards
- skipping documentation updates and losing context mid-build

## Schedule Recommendation

If any core-path item slips by more than three working days, cut optional scope first:

1. defer PWA
2. keep billing simple
3. narrow admin tooling
4. keep analytics lightweight

Do not cut:

- student core session flow
- adult visibility
- access control
- extracted-text review
- iPad usability
