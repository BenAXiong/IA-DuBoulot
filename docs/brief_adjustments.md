# Brief Adjustments

Related: [README](../README.md) | [Original brief](../project_brief_codex.txt) | [Implementation plan](implementation_plan.md) | [MVP to-do list](mvp_todo.md)

This file lists the main changes, additions, and sequencing adjustments made while turning the original brief into an execution-ready plan.

## Added

- Added a dedicated bootstrap phase for git, GitHub, deployment, secret handling, and service-account setup.
- Added a documentation spine: `README.md`, `AGENTS.md`, implementation plan, decision log, work sessions log, and `Vibestructions`.
- Added a requirement for task IDs and cross-linking between docs, scripts, SQL, and future code artifacts.
- Added seed accounts, demo fixtures, and smoke-test preparation to the plan.
- Added preview/production deployment setup as an explicit deliverable.
- Added legal/privacy and deletion-flow tasks suitable for a product used by minors.
- Added explicit modularity rules so the codebase does not collapse into god components or hidden logic piles.
- Added explicit iPad Safari QA and recurring access-audit checkpoints.
- Added explicit deployment, billing, and starter AI-provider decisions once the founder clarified them.

## Reordered

- Moved schema design, access matrix work, and RLS ahead of broad UI implementation.
- Moved upload and extracted-text handling earlier, because the product depends on real homework intake.
- Moved AI provider abstraction and prompt contracts earlier than adult dashboards and memory features.
- Moved billing provider selection into planning, but deferred provider-specific integration until later phases.
- Kept PWA work at the end instead of treating it as part of the core MVP path.

## Clarified

- Clarified that the first serious workflow slice is the student intake-to-session-to-summary loop.
- Clarified that parent and tutor dashboards are review surfaces, not broad workflow editors.
- Clarified that handwriting support can remain limited in MVP as long as photo/PDF intake and editable extraction are solid.
- Clarified that moderation and pedagogical guardrails are part of the first AI implementation, not post-launch polish.
- Clarified that traceability drift is a top-level project risk and must be managed through mandatory documentation behavior.
- Clarified that clean architecture means small domain modules, thin route/page layers, and no large mixed-responsibility components.
- Clarified that the initial deployment target is Vercel, the initial billing provider is Lemon Squeezy, and the initial AI path is Gemini-first with a swappable provider layer.

## Deferred

- Deferred native apps, advanced handwriting OCR, live tutor chat, textbook RAG, and heavy marketing-site work exactly as the brief intended.
- Deferred optional PWA installability until the core web experience is stable.
- Deferred richer billing sophistication until after a basic trial and usage-cap path exists.
