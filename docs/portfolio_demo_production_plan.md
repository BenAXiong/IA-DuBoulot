# Portfolio Demo Production Plan

Related: [README](../README.md) | [Implementation plan](implementation_plan.md) | [Portfolio golden path](portfolio_golden_path.md) | [Pilot_todo](pilot_todo.md) | [Smoke checklist V1](smoke_checklist_v1.md) | [Decision log](decision_log.md)

## Purpose And Authority

This document is the durable orchestration plan for producing the Banban portfolio video and its reproducible recording pipeline.

The implementation plan, MVP and Pilot boards, recorded product decisions, access/privacy rules, and established product contracts remain authoritative. The video follows the product. Demo work may prioritize roadmap-aligned fixes, but it must not redefine learner behavior, visibility, persistence, deletion, or safety rules to make a recording easier.

The root Codex agent acts as orchestrator. It owns scope, dependency gates, task-board and decision-log maintenance, integration, cloud mutations, final verification, and the stop decision. Subagents receive bounded implementation or review slices and do not independently widen product scope.

## Current Infrastructure Decision

Keep IA DuBoulot in its existing Supabase project and organization.

Observed in the Supabase dashboard on 2026-10-01:

- IndiHunt database size: `405.46 MB`
- IA DuBoulot database size: `30.2 MB`
- organization file storage: `0.123 / 1 GB`
- Free-plan database allowance shown by the detailed usage panel: `0.5 GB per project`

IndiHunt is close to its own per-project read-only threshold. Moving IA DuBoulot to another account would not reduce IndiHunt's database size or remove that risk. It would instead add credential, ownership, environment, deployment, Auth, and migration work to the time-critical demo path. Treat IndiHunt capacity remediation as a separate project concern.

Revisit this decision only if the live Supabase usage model changes, IA DuBoulot itself approaches its per-project limit, or a paid organization/project transfer becomes desirable for operational reasons unrelated to the video.

## Production Outcome

Produce a short, credible, repeatable portfolio video showing:

1. the English public landing page
2. sign-in to Matt's prepared student account
3. the Mathematics homework surface with two subject resources, matching the existing paid account cap
4. manual selection of `fractions_add_prod.pdf`
5. Matt asking `what's the answer to b?? i don't get fractions`
6. a live Gemini response that identifies the source context, proposes a plan, withholds the final answer, and gives a useful first hint
7. the existing completion flow and learner recap
8. an optional short engineering-depth card or narration, without touring secondary roles

The production must also leave behind a documented command path that can regenerate the browser take and later export selected GIF segments after UI, account, copy, or workflow changes.

## Orchestration Rules

- The orchestrator maintains this plan, `docs/pilot_todo.md`, and `docs/decision_log.md`; subagents should not compete on those files.
- Cloud writes, demo credentials, production deployment, and final capture stay serialized under the orchestrator.
- Parallel work is allowed only on independent file areas or read-only audits.
- Every implementation lane reports changed files, verification evidence, remaining risks, and the exact task IDs it satisfies.
- A lane is integrated only after scoped review and proportionate tests.
- Credentials and private source paths remain outside git.
- Private Mathematics resources may be uploaded to the prepared account, but must not be copied into the repository.
- Visible product fixes remain mapped to `P1.1`-`P1.3`, `P2.1`, `P2.3`, or `P3.3`; the `P7` lane tracks production-specific orchestration and automation rather than replacing those roadmap tasks.

## Dependency Graph

```text
P7.1 durable plan and infrastructure decision
  |
  +--> P7.2 Matt demo seed -----------------------+
  |                                                |
  +--> P1.1/P1.2 visual direction from user ------+--> P2.1 exact-path audit
  |                                                |       |
  +--> recording architecture spike --------------+       +--> P1.3/P2.3/P3.3 bounded fixes
                                                           |
                                                           +--> P7.3 deployed live-AI proof
                                                                   |
                                                                   +--> P7.4 storyboard lock
                                                                           |
                                                                           +--> P7.5 recorder + MP4/GIF pipeline
                                                                                   |
                                                                                   +--> P7.6 final QA, capture, handoff
```

## Agent Lanes

### Lane A — Demo Data And Supabase

Primary task: `P7.2`.

Deliverables:

- idempotent `scripts/seed-portfolio-demo.mjs`
- environment-only Matt credentials with safe `.env.example` documentation
- Matt student profile, English UI, `5e` Mathematics context, and already-approved guardian state consistent with current minor safeguards
- believable existing activity without reusing or modifying destructive RLS fixtures
- an active demo subscription state using the existing paid resource allowance
- two uploaded private Mathematics resources, `fractions_add_prod.pdf` and `fractions.pdf`, with the first ready for explicit selection
- reset behavior scoped to the dedicated disposable Matt account: clear its account-owned conversation/runtime state while preserving the two expected resources by content hash
- verification proving RLS separation, resource readiness, account authentication, and repeatable reruns

Constraints:

- do not alter `scripts/seed-rls-fixtures.mjs` semantics
- do not print or commit credentials
- create and verify resources through the canonical product path rather than bypassing its cap with privileged table inserts
- do not bypass normal product access rules
- do not raise upload limits for the video

### Lane B — Product And Visual Readiness

Primary tasks: `P1.1`, `P1.2`, `P1.3`, `P2.1`, `P2.3`, and visible-path portions of `P3.3`.

Deliverables:

- evidence-backed desktop audit of `/`, `/auth`, `/app`, the Mathematics subject/resource state, the conversation workbench, and completion
- explicit distinction between defects, presentation debt, and out-of-path backlog
- implementation of only approved, bounded fixes after the user's overall design direction is available
- removal or production-gating of developer residue visible on the path
- clear resource selection, pending, retry, and completion states
- before/after screenshots or equivalent browser evidence

This lane does not redesign adult surfaces, billing, the full device matrix, or unrelated placeholder destinations merely for completeness.

### Lane C — Live Coaching Contract

Primary task: `P7.3`; related product reliability task: `P3.3`.

Deliverables:

- production run using the selected fractions resource and Matt's deliberately vague question
- acceptance checks that the reply identifies or correctly uses exercise `b`, proposes a plan, gives a hint, and does not reveal the final result
- bounded retry/take policy for provider failure or unsuitable output
- recorded latency and fallback behavior sufficient to choose capture timing

This lane validates the existing coaching contract. Prompt changes require evidence, remain roadmap-aligned, and must be logged if behavior changes.

### Lane D — Storyboard And Capture Automation

Primary tasks: `P7.4` and `P7.5`.

Planned source locations:

- human-editable storyboard: `docs/portfolio_demo_storyboard.md`
- machine-readable scene/actions definition: `scripts/portfolio-demo/storyboard.mjs`
- Playwright runner, isolated locators, acceptance checks, and preflight/render helpers: `scripts/portfolio-demo/`
- generated, gitignored media: `artifacts/portfolio-demo/<run-id>/`

Deliverables:

- fixed viewport and deterministic account reset/preflight
- explicit checks for the target URL/deploy ref, free disk, Chrome, FFmpeg/ffprobe, and Playwright's recording helper
- authentication before the recorded scenes so credentials never appear in footage
- stable accessible selectors, with targeted `data-testid` hooks only where semantics are insufficient
- Playwright WebM capture with scene timestamps, screenshots, and a capture-only cursor/click indicator
- live-response acceptance checks against the message API and a bounded two- or three-take retry; a rejected take starts a fresh conversation instead of resending inside the same one
- FFmpeg rendering to final MP4
- FFmpeg palette-based GIF export for named scene ranges
- a redacted run report recording source/deploy revisions, seed/storyboard version, viewport, timings, selected resource, provider/model evidence, acceptance results, retry count, media metadata, and output hashes
- concise reproduction commands and failure diagnostics

The recorder should make actions reproducible, not pretend that live model wording is byte-identical across takes.

### Lane E — Independent Final Review And Handoff

Primary task: `P7.6`.

Deliverables:

- clean production deployment matching verified source
- green relevant regression and golden-path checks
- independent visual/reliability review of the exact final take
- final MP4, selected GIFs, raw take, scene/timing manifest, and reproduction instructions
- confirmation that no credentials, private paths, debug overlays, raw errors, or unintended personal information appear
- explicit stop decision once the golden-path acceptance criteria pass

## Execution Waves

### Wave 0 — Complete

- decide against migrating IA DuBoulot solely because IndiHunt is near its database quota
- create this durable orchestration plan

### Wave 1 — Parallel Prerequisites

- Lane A implements Matt's idempotent demo seed
- Lane B audits the exact desktop path and waits for the user's design direction before broad visual changes
- Lane D builds only the recorder skeleton and scenario contract that do not depend on final selectors or layout

### Wave 2 — Product Lock

- orchestrator consolidates the audit
- user provides or approves the overall design direction
- Lane B implements bounded visible-path fixes
- Lane C proves the live coaching turn on the deployed result

### Wave 3 — Storyboard And Recorder Lock

- write the shot-level storyboard against stable UI
- finalize selectors, timing, narration/caption cues, acceptance rules, and output profiles
- run one end-to-end rehearsal and repair only recording blockers

### Wave 4 — Final Production

- deploy verified source
- reset Matt to the recorded baseline
- capture accepted live-AI takes
- render final MP4 and GIF candidates
- run independent review, retain raw assets, and document exact reproduction commands

## Gates And Stop Conditions

Do not lock the storyboard until:

- Matt's account and resource state are reproducible
- the user's overall design direction is known
- the final theme, capture aspect ratio/viewport, and whether the landing-page shot is in the final cut are decided
- the exact path has no unresolved trust-breaking defect

Do not record the final take until:

- the deployed commit is known
- the selected resource is ready and selectable
- the live coaching contract has passed at least once after the last relevant deployment
- loading, retry, and completion states are acceptable on the recording viewport

Stop implementation and publish the demo when:

- the acceptance criteria in `docs/portfolio_golden_path.md` pass
- the final take contains no visible blocker
- the reproduction command succeeds from the documented baseline
- remaining issues are outside the recorded path or already belong to the ordinary roadmap

## Immediate Next Dispatch

After this plan is accepted:

1. dispatch Lane A to implement `P7.2`
2. dispatch a read-only Lane B visual/path audit while the user develops the overall design direction
3. dispatch Lane D to scaffold the scenario and capture interfaces without locking scene selectors
4. integrate and verify those slices before authorizing visible product changes or cloud seeding
