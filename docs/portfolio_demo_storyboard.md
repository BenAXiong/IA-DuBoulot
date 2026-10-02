# Portfolio Demo Storyboard V1

Related: [Portfolio demo production plan](portfolio_demo_production_plan.md) | [Portfolio golden path](portfolio_golden_path.md) | [Implementation plan](implementation_plan.md) | [Pilot_todo](pilot_todo.md) | [Decision log](decision_log.md)

## Purpose And Authority

This is the human-editable editorial source of truth for the first Banban portfolio cut under `P7.4`. It defines the story, visible actions, overlay copy, and timing intent before those choices are bound to recorder actions under `P7.5`.

The implementation plan, roadmap boards, recorded decisions, and established product contracts remain authoritative. If the product changes, revise this storyboard to follow the product rather than altering learner behavior for the recording.

## Locked Cut

- Format: silent screen recording with concise text overlays; no narration or music is required for V1.
- Target duration: `46 seconds`; acceptable final range: `42–48 seconds`, within the broader `30–60 second` brief.
- Capture: `1440 x 810` browser viewport, upscaled to a `1920 x 1080` `16:9` export, English UI, light theme. The tighter viewport deliberately enlarges product text in the delivered frame.
- Starting state: already authenticated as Matt on the student dashboard. Authentication happens before recording and credentials never appear.
- Story: dashboard → Mathematics → three-source library → manual selection of `fractions_add_prod.pdf` → exact vague learner question → honestly shortened live wait → accepted plan-and-hint response.
- Ending: hold on the accepted coaching response. Do not show completion, a recap, or another product surface.
- Excluded: public landing, sign-in, onboarding, settings, billing, completion, and parent, tutor, or admin views.

## Shot List

Edited time is the intended V1 timeline. Raw timing is an instruction for capture and editing, not a promise that live provider latency is deterministic.

| ID | Edited time | Target length | Product picture and action | Exact overlay copy | Raw and edit intent |
|---|---:|---:|---|---|---|
| `s01-matt-dashboard` | `00:00–00:04` | 4s | Open on Matt's authenticated student dashboard. Hold long enough to register the learner context, then move toward Mathematics. | **AI homework coaching, grounded in real course material.** | Begin from a settled page with no loading motion. Use a clean cut in; no landing-page or sign-in footage. |
| `s02-open-mathematics` | `00:04–00:09` | 5s | Open Mathematics and reveal the subject workspace with all three prepared resources visible: `fractions_add_prod.pdf`, `fractions.pdf`, and `equations.pdf`. | **Matt already has three Mathematics resources ready.** | Capture the real navigation and settled library. The filenames must remain readable for at least 2s before selection. |
| `s03-choose-source` | `00:09–00:15` | 6s | Manually select `fractions_add_prod.pdf`. Hold on the unmistakable selected state while the other two resources remain visible. | **He chooses the source for this question.** | Preserve the real click and selection feedback at natural speed. Do not preselect off-camera or imply that every resource is being used. |
| `s04-ask-question` | `00:15–00:24` | 9s | In the homework composer, enter `what's the answer to b?? i don't get fractions`, keep the selected-source state visible where the UI allows, then send once in Thinking mode. | **A real learner question — not a perfect prompt.** | Record the exact question. Typing may be accelerated in the edit, but the complete text must be readable for at least 2s before Send is activated. |
| `s05-live-wait` | `00:24–00:26` | 2s | Show the genuine pending/thinking state immediately after Send. | **Live AI response · waiting time shortened** | Preserve the full provider wait in the raw take. In the final edit, show the start of the real pending state, use one obvious time-compression cut, and then show the accepted response arriving. Never present the response as instantaneous. |
| `s06-plan-and-hint` | `00:26–00:43` | 17s | Reveal and, only if needed, gently scroll through the accepted live response. Keep the selected resource visible in the chat rail when practical. The readable portion must identify exercise `b`, propose a short plan, and offer a useful first hint without exposing the final result. | **banban finds exercise b, then gives a plan and a first hint — not the answer.** | The response wording may vary by accepted live take. Use a restrained reveal or one slow scroll; do not rewrite, splice, or add answer text. Hold each key passage long enough to read. |
| `s07-value-hold` | `00:43–00:46` | 3s | Stop interacting and hold on the strongest response frame, with the selected source still evident where possible. | **Context-aware coaching, not answer dumping.** | End on the product UI. A simple fade to black is allowed after the 3s hold; no completion click or extra end-card claim is part of V1. |

## Overlay Treatment

- Use the exact copy above for V1.
- Present one overlay at a time, in a consistent lower-left safe area unless it would cover the active control or essential response text; move that shot's overlay to the upper-left safe area when needed.
- Keep overlays to two lines maximum, high-contrast, and visually quieter than the application.
- Use short fades rather than animated entrances. The cursor and click indicator may remain visible, but overlays must not follow the pointer.
- Do not add claims about grades, learning outcomes, safety certification, or production readiness.
- The product UI carries the Matt, `5e`, English, and Mathematics context; overlays should not repeat all of it.

## Raw Capture Contract

The recorder must preserve one complete chronological take from `S01` through the accepted response, even though the final edit shortens inactivity.

1. Reset and verify the dedicated Matt baseline before capture.
2. Authenticate before recording begins.
3. Confirm the English UI, light theme, `1440 x 810` browser viewport, `1920 x 1080` output profile, three ready Mathematics resources, and no selected source carried over from a prior temporary conversation.
4. Record one manual selection of only `fractions_add_prod.pdf`.
5. Send the exact learner question once in a fresh conversation.
6. Preserve the complete pending state and response arrival in the raw take.
7. Accept only a response that passes the established live-coaching contract; a rejected take starts a fresh conversation and is not stitched into the accepted take.
8. Retain the accepted raw take, scene timestamps, and redacted run evidence alongside the rendered cut.

The edit may accelerate typing, shorten page-settle time, and compress the provider wait. It must not reorder actions, combine different accepted takes into one apparent response, remove a visible error to make a failed take look successful, or imply deterministic response wording.

## Acceptance Rules

The V1 cut is acceptable only when all of these are true:

- duration is `42–48 seconds`
- the first product frame is Matt's authenticated dashboard, not a title-only card, landing page, or sign-in screen
- the UI is English and light-themed, the app content is captured at `1440 x 810` and exported at `1920 x 1080`, and no deploy hash, credential, private local path, debug payload, raw provider error, or unrelated personal information is visible
- all three approved resource filenames are visible and readable before selection
- `fractions_add_prod.pdf` is the only manually selected source and the chosen state is visually clear
- the exact question `what's the answer to b?? i don't get fractions` is readable before it is sent
- the genuine live wait appears in chronological order and the overlay explicitly discloses that waiting time was shortened
- the accepted provider response uses the selected source, identifies or correctly handles exercise `b`, proposes a plan, provides a useful first hint, and withholds the final result
- the response remains readable long enough for a viewer to understand the plan-and-hint behavior
- the last product frame is the accepted response; no completion, recap, adult view, or feature tour follows it
- the cut works without audio and every overlay stays clear of the demonstrated control or key response passage

## Revision Rules

- Keep shot IDs stable after recorder binding. Revise a shot's timing or copy under the same ID when its narrative purpose is unchanged.
- Treat this Markdown file as the editorial source. Under `P7.5`, the machine-readable storyboard must mirror its enabled shots, action order, exact question reference, and timing ranges; generated media is never the source of truth.
- Overlay-only changes do not require a new browser take when the underlying product footage still satisfies every acceptance rule. Each render must retain a clean edited MP4 without burnt-in overlays so narration or replacement overlays can be added later.
- Navigation, control, source-selection, question, or response-framing changes require a recorder rehearsal and locator check before rendering again.
- A change to the learner, selected resource, learner question, core coaching claim, starting surface, or included product scope requires explicit user approval before rebinding the recorder.
- Live wording may vary. Choose another complete accepted take rather than rewriting the model response or joining response fragments from multiple takes.
- If the UI can no longer show all three filenames, the selected state, or the key response text legibly in the `1440 x 810` capture viewport, pause the cut and resolve the mismatch under the ordinary roadmap before changing the story.
- Keep the final cut inside `30–60 seconds`; prefer trimming holds and transitions before removing the source-selection or answer-withholding proof.

## V1 Review Questions

When reviewing the first render, decide only:

1. Can a new viewer understand the product and the source-selection depth without narration?
2. Is the vague question readable long enough to feel intentional rather than careless?
3. Is the shortened live wait honest and unobtrusive?
4. Can the viewer read the plan and first hint before the cut ends?
5. Does the final response frame communicate enough value, or should `S06` receive more time by trimming earlier holds?

Changes from that review should update this file before the recorder or render profile is revised.
