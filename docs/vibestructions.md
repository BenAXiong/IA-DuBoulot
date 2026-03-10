# Vibestructions

Related: [README](../README.md) | [AGENTS](../AGENTS.md) | [Implementation plan](implementation_plan.md) | [MVP to-do list](mvp_todo.md) | [Work sessions log](work_sessions.md)

This is the operating guide for doing serious long-term "vibe coding" without turning the project into an untraceable pile of half-remembered prompts, files, and regressions.

## Core Principle

Vibe coding only works long-term when the vibes are constrained by structure. The point is not to improvise everything. The point is to move fast while leaving a durable trail for the next session.

## Project Creation Rules

Before writing real product code, make sure the project has:

- a git repo and GitHub remote
- a deployment target
- a naming decision
- a source-of-truth README
- a to-do list with stable task IDs
- a decision log
- a work sessions log
- an agent workflow file
- an environment variable plan

If any of those are missing, the project is not ready for sustained AI-assisted implementation.

## One Spine, Not Many

Do not scatter project truth across random places.

Use one main spine:

- `README.md` for the index
- `AGENTS.md` for workflow rules
- `docs/mvp_todo.md` for execution order
- `docs/decision_log.md` for structural choices
- `docs/work_sessions.md` for chronology

Anything durable should point back into that spine.

## Session Discipline

At the start of each work session:

1. open the work sessions log
2. read the current plan and to-do list
3. confirm the active task IDs
4. inspect the relevant code before changing it

At the end of each meaningful implementation chunk:

1. update task status
2. log structural decisions
3. add missing hyperlinks
4. record testing or smoke-check status

If a session produces code but not metadata updates, the session is incomplete.

## Build In Thin Vertical Slices

Prefer:

- one complete flow with weak polish
- one stable service boundary
- one good role separation rule
- one real smoke test

Avoid:

- five half-built flows
- broad speculative abstractions
- creating screens before the data model exists
- provider-specific lock-in before the interface is clear

## Traceability Rules

Every durable artifact needs an address and a parent.

- A new script must be referenced from a doc.
- A new SQL file must be referenced from a plan or implementation doc.
- A new prompt file must be referenced from the AI plan and decision log when it changes behavior.
- A new folder must be mentioned in `README.md` if it matters to future work.
- A new workflow rule must be added to `AGENTS.md`.

No orphan files. No hidden prompt magic. No undocumented setup steps.

## Good Task Hygiene

Each task should be:

- small enough to complete or meaningfully advance in one session
- identifiable by a stable ID
- connected to an outcome, not just an activity
- easy to test or smoke-check

If a task feels vague, split it before coding it.

## Good Decision Hygiene

Log a decision whenever you change:

- architecture
- schema
- role behavior
- prompts
- provider choices
- deployment assumptions
- operating workflow

If future-you could reasonably ask "why is it like this?", that answer belongs in the decision log.

## Good Review Hygiene

Before calling something done:

- check the actual user flow
- check the role boundary
- check the error path
- check the mobile/tablet layout if the feature is user-facing
- check whether the docs still describe reality

Shipping without this pass just means the debugging bill arrives later.

## Anti-Patterns

Avoid these:

- coding from memory instead of reading the current files
- letting the backlog drift from the actual build order
- adding "temporary" scripts that never get documented
- burying setup knowledge in chat history
- changing prompts or auth logic without logging it
- creating giant files because it feels faster in the moment

## Definition Of Healthy Vibe Coding

Healthy vibe coding feels fast, but a new agent can still answer all of these within minutes:

- What is the product trying to do?
- What is the current active phase?
- What changed recently?
- Where do prompts live?
- Where do scripts live?
- What still blocks MVP?
- What session is currently open?

If those questions are hard to answer, slow down and repair the project spine before writing more code.
