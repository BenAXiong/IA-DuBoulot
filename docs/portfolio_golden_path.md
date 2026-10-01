# Banban Portfolio Golden Path

Related: [README](../README.md) | [Implementation plan](implementation_plan.md) | [MVP to-do list](mvp_todo.md) | [Pilot_todo](pilot_todo.md) | [Portfolio demo production plan](portfolio_demo_production_plan.md) | [Founder walkthrough V1](founder_walkthrough_v1.md) | [Launch checklist V1](launch_checklist_v1.md) | [Sample attachment corpus](sample_attachment_corpus.md)

> **Purpose:** alignment document for Codex while preparing IA DuBoulot / Banban as a portfolio demo.
>
> This is **not** the product roadmap, Pilot backlog, or a request to finish the application.
> Its only goal is to make one short external demo convincing enough to support freelance/client acquisition.

## Authority And Conflict Rule

The original product direction remains authoritative. If this document conflicts with the implementation plan, MVP or Pilot roadmap, recorded product decisions, access/privacy rules, or established product contracts, those sources win. This document may narrow which roadmap work is urgent for a portfolio demo; it must not reverse, redefine, or bypass the project's intended behavior to make the demo easier.

The video must follow the roadmap-aligned product, not the reverse. If the preferred recording sequence conflicts with the product's intended behavior, change the sequence or narration before considering a product change.

## 1. Objective

Make Banban demonstrably credible in a short portfolio video watched by a prospective client with little context.

The target impression is:

> “This person can take a substantial product idea and build a real, coherent, deployed AI/SaaS application with authentication, persistent data, file handling, AI workflows, role-aware architecture, localization, and sensible failure handling.”

The demo does **not** need to prove that Banban is a finished commercial product, or optimize for prospective clients creating accounts and testing it themselves.

## 2. Hard Scope Rule

Until this document is explicitly retired, work proposed under **portfolio demo / golden path** must satisfy at least one of these:

1. It prevents the golden path below from completing.
2. It creates an obvious trust-breaking defect visible during the golden path.
3. It removes developer/prototype residue directly visible during the golden path.
4. It materially improves a portfolio viewer’s ability to understand the product within the first few minutes.
5. It makes the deployed golden path reliably reproducible.

If a proposed change does not satisfy one of these conditions, **do not implement it as part of golden-path work**. Record it in the appropriate existing backlog if useful and continue.

Examples of non-blocking work:

- imperfect tag/chip wrapping outside the golden path
- broad design-system cleanup
- refactoring code that already works
- parent/tutor/admin polish not required by the demo
- PWA work
- comprehensive device coverage
- real iPad Safari validation
- additional AI features
- richer pedagogical memory UX
- new subject modes
- generalized abstraction work
- billing polish
- exhaustive accessibility cleanup outside critical controls
- “while we are here” improvements

**A visible imperfection is not automatically a blocker.**

## 3. Demo Audience

Assume the viewer is one of:

- a founder with an unfinished MVP
- a small company needing an internal/productivity tool
- a client looking for Next.js/Supabase/AI integration work
- someone evaluating whether the developer can understand and ship a complicated product

Do not optimize this demo primarily for:

- investors
- parents buying Banban
- educational pilots
- production launch readiness
- a comprehensive tour of every role
- demonstrating every feature in the repository

## Confirmed Demo Parameters

- primary presentation language: English; this does not change the product's multilingual scope or default-language decisions
- primary deliverable: a recorded portfolio video from a prepared portfolio account
- secondary capability: the same account and path should remain usable for a live walkthrough, but self-serve client signup/testing is not a demo requirement
- primary viewport: desktop/laptop; existing responsive behavior remains part of product quality but is not the main recording frame
- AI proof: the intended coaching turn must use live provider output; the deterministic fallback remains an honest operational safety net, not the planned portfolio result
- depth signal: manually select one relevant source from a visible library of three prepared Mathematics resources, within the five-resource paid subject cap, then show the live coaching response use that context
- portfolio learner: `Matt`, a fictional `5e` learner in the French Section of Taipei European School; the account uses the English UI and must remain separate from automated RLS fixtures

## Portfolio Account And Demo Turn

The prepared portfolio account is production-like demo data, not a test fixture and not a new product mode.

Account profile:

- display name: `Matt`
- school context: French Section, Taipei European School
- grade: `5e`, matching the proposed workbook and exercise level
- UI language: English
- state: believable existing Mathematics activity plus three private subject resources available for manual selection

Resource plan:

- preferred content area: `Fractions - operations`
- prepare a visible library of three small, topic-focused Mathematics resources from the locally available `Math5` set, subject to ordinary rights and demo-safety checks: `fractions_add_prod.pdf`, `fractions.pdf`, and `suite_d_operations.pdf`
- make `fractions_add_prod.pdf` the selected source for the coaching turn; exercise `b` asks the learner to calculate `6/14 + 12/21`
- do not commit private external resources or their local filesystem paths
- do not upload the complete `33,460,053` byte workbook for the recording; the smaller topic resources already fit the intended flow and current product limit
- keep chat attachments and subject resources separate, consistent with the established product contract

Matt's learner question:

> what's the answer to b?? i don't get fractions

The question is deliberately vague, informal, and answer-seeking. The convincing behavior is for the live coach to use the selected source to identify exercise `b`, avoid dumping the result, propose a short plan (`simplify`, inspect the denominators, then add), and offer the first useful hint or question. This demonstrates coaching behavior rather than making Matt write the ideal prompt for the product.

## 4. Golden Path

Target duration: **2–4 minutes** without narration, or about **3–5 minutes** with narration.

### Step 0 — Public landing

Start at the deployed `/` route.

The viewer should be able to understand within roughly 10 seconds:

- this is an AI-assisted homework/coaching product
- it is a real application rather than a static mockup
- there is a clear path into the product

**Required:**

- no broken hero/layout
- no conspicuous placeholder/developer copy above the fold
- primary CTA works
- selected language renders coherently
- mobile/tablet/desktop layout need only be credible, not perfect

Do not spend golden-path time touring pricing or secondary marketing content.

### Step 1 — Enter a prepared student account

Use a prepared demo student account.

The account should already be in a useful, believable state unless demonstrating first-run behavior is specifically valuable.

Land on `/app`.

The first protected screen should communicate:

- authenticated application
- student identity/context
- subjects/homework entry point
- some evidence of persisted state/history where useful

Do not tour settings, billing, parent, tutor, or admin surfaces.

### Step 2 — Start homework from a subject

From the Homework view:

1. choose a subject
2. start a fresh homework conversation
3. provide a short real learner prompt
4. optionally attach the canonical safe sample PDF/resource

The transition into the conversation should feel intentional and should not expose implementation artifacts.

**Required:**

- conversation creation succeeds
- the user sees immediate state/feedback
- upload state, if used, is understandable
- no dead end or confusing route transition
- no raw exception/provider/debug text

### Step 3 — Show one convincing AI coaching turn

Send one learner message that demonstrates the core product interaction.

The response should make Banban look like a **coaching application**, not merely a generic chat wrapper.

Prefer a prompt/sample that lets the interface demonstrate some combination of:

- awareness of the homework/context
- use of uploaded or subject material
- structured pedagogical response
- persistent conversation state
- a purposeful student workflow around the chat

One strong turn is enough.

Do **not** extend the demo just to prove that a long conversation works.

Provider fallback is acceptable if the resulting user experience remains coherent. Provider instability must not surface as a broken demo.

### Step 4 — Show one piece of product depth

Choose **one** depth signal that is already reliable.

Preferred order:

1. uploaded/subject resource visibly informing the conversation
2. persistent workspace/context associated with the homework
3. subject-level resource selection/library
4. another already-stable feature that makes the product clearly more than a generic chatbot

Do not add a new feature for this step if an existing stable one works.

The purpose is simply to create the reaction:

> “There is a real application model behind this chat.”

### Step 5 — Complete the homework

Use the existing completion action.

The viewer should see:

- an intentional completion transition
- a concise learner-facing recap/summary
- the conversation becoming completed/read-only if that is the current contract
- evidence that the application has retained meaningful session state

This is the end of the golden path.

Do not continue into parent/tutor/admin unless specifically requested during a live conversation.

## 5. Optional 30-Second “Under the Hood” Proof

This is portfolio/case-study material, **not additional UI scope**.

Near the demo, summarize that the application includes:

- Next.js application architecture
- Supabase authentication and persistent data
- row-level security / role-aware access
- student, parent, tutor, and admin models
- file upload/extraction and subject resources
- Gemini-backed coaching with bounded fallbacks
- multilingual UI
- deterministic fixture/regression tooling
- billing/privacy/oversight infrastructure

The point is to show that the polished student slice sits on substantial engineering, without forcing the viewer through every surface.

## 6. Demo-Ready Acceptance Criteria

The portfolio golden path is **READY** when all of the following are true:

### Reliability

- [ ] deployed production URL loads
- [ ] demo student can authenticate reliably
- [ ] `/app` loads the intended student state
- [ ] a new homework conversation can be created
- [ ] one learner message produces a usable live-provider coaching response; coherent fallback remains available for an unplanned provider outage
- [ ] chosen depth signal works
- [ ] completion succeeds
- [ ] learner recap/summary appears
- [ ] no golden-path step exposes an unhandled error, raw stack trace, or dead end

### Presentation

- [ ] landing page explains the product quickly enough
- [ ] no conspicuous placeholder/developer wording appears on the path
- [ ] no obviously broken layout appears on the target demo viewport
- [ ] loading/pending states are understandable
- [ ] the core controls used in the demo are easy to identify and operate
- [ ] completion feels like a deliberate product endpoint rather than an internal/debug state

### Reproducibility

- [ ] `npm run regress:mvp` is green, or any accepted non-blocking warning is understood
- [ ] production deployment corresponds to the verified code
- [ ] prepared demo credentials/state are known out of band
- [ ] demo content/sample files are deterministic and safe to use
- [ ] the golden path has been manually run once against production after the last relevant deployment

When these boxes are satisfied, **stop golden-path development and publish/use the demo.**

## 7. Explicit Non-Goals

The following are **not required** before putting Banban on the portfolio or using it in Malt/Upwork applications:

- completing the Pilot backlog
- perfect visual consistency across every route
- fixing every small tap target
- perfect tag/chip wrapping everywhere
- parent journey polish
- tutor journey polish
- admin journey polish
- live billing demonstration
- real-user email infrastructure
- productionizing every optional AI summary
- eliminating all provider fallbacks
- PWA/installability
- real iPad Safari validation
- full browser/device matrix
- avatar upload
- every sidebar destination being implemented
- complete pedagogical-memory UX
- new coaching modes
- new AI capabilities
- embeddings/vector retrieval
- refactors without a visible golden-path benefit
- cleaning every warning or TODO
- making Banban ready for public commercial launch

## 8. Codex Operating Instructions

When asked to work toward the **Banban portfolio golden path**:

1. Read this file first.
2. Inspect current production/code behavior before assuming an item is broken.
3. Prefer the smallest change that makes the golden path credible.
4. Do not broaden a local fix into an architectural cleanup without a demonstrated blocker.
5. Do not implement adjacent backlog items opportunistically.
6. If you notice unrelated defects, record/report them separately; do not silently absorb them into scope.
7. Prefer existing fixtures, smoke scripts, components, and product contracts.
8. Preserve current auth/RLS/privacy boundaries while simplifying presentation.
9. Verify the affected golden-path step after each coherent change.
10. Once the acceptance criteria above are satisfied, say explicitly that the portfolio golden path is ready and recommend stopping rather than proposing further polish.

### Decision test before coding

For every proposed change, answer:

> **Would a prospective client plausibly notice this problem during the 2–5 minute golden path, and would it reduce their confidence in the developer?**

If **no**, it is normally out of scope.

If **yes**, fix it with the narrowest reasonable change.

## 9. Recommended Demo Narrative

Keep narration short.

### Opening

> Banban is a supervised AI homework coach I built around a real multi-role application rather than a standalone chatbot. I’ll show the student path.

### During homework start

> A student starts from a subject, can bring in the homework or longer-lived course material, and the conversation persists as actual application state.

### During AI turn

> The coaching layer uses the learner’s context and resources, while the application keeps provider failures bounded so the workflow can degrade without simply collapsing.

### At completion

> Completing the homework creates a durable recap and closes the session. Behind this student flow there are separate parent/tutor access rules, RLS, privacy controls, usage tracking, billing infrastructure, and regression fixtures.

Then stop.

## 10. Portfolio Case-Study Skeleton

The eventual portfolio entry can remain short:

### Banban — AI Homework Coach

**Problem**

Build an AI homework experience that behaves like a real supervised product rather than a generic chat interface.

**What I built**

A deployed multilingual Next.js/Supabase application with persistent homework sessions, document/resource handling, AI coaching, completion summaries, multi-role access, RLS, privacy controls, usage/billing infrastructure, and automated regression fixtures.

**What the demo shows**

Student login → subject/homework start → contextual AI coaching → resource-backed workflow → completed session recap.

**Engineering depth**

Role-aware data access, hosted Supabase/RLS, provider fallbacks and latency bounds, file extraction/resource retrieval, multilingual surfaces, deterministic fixture seeding, and smoke/regression coverage.

**Status**

Portfolio demo / pilot-stage product. The demo intentionally focuses on the strongest student workflow rather than presenting every implemented role and operational surface.

## 11. Current Baseline at Time of Writing

As of **2026-09-30**, the repository reports:

- the original hosted Supabase project restored and current
- latest `npm run regress:mvp` passing
- hosted RLS verification passing `20/20`
- production student flow passing after bounded provider-latency fixes
- production public localization checks passing
- French and Chinese tablet-emulation flows passing in both orientations
- student completion producing the required student summary and becoming read-only
- optional adult summary variants allowed to fail/degrade without blocking the student contract
- subject-level resource upload/selection/retrieval implemented

Therefore the default assumption is **not** that Banban needs major engineering before portfolio use.

The next work should be a **manual golden-path audit and narrowly scoped presentation fixes**, not another feature cycle.

---

## Stop Condition

**The moment the production golden path is reliable, understandable, and visually credible, Banban ships to the portfolio.**

Do not wait until Banban feels finished.

It is not being evaluated as a finished startup.

It is evidence that you can build.
