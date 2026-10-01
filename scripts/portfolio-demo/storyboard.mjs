import { MATT_FRACTIONS_CONTRACT_ID } from "./acceptance-contract.mjs";
import { validateStoryboard } from "./storyboard-schema.mjs";

export const PORTFOLIO_DEMO_QUESTION =
  "what's the answer to b?? i don't get fractions";
export const PORTFOLIO_DEMO_RESOURCE = "fractions_add_prod.pdf";

export const PORTFOLIO_DEMO_STORYBOARD = validateStoryboard({
  schemaVersion: 1,
  id: "matt-silent-demo-v1",
  title: "Matt asks for help with fractions",
  scenes: [
    {
      id: "s01-matt-dashboard",
      title: "Prepared learner account",
      purpose: "Establish a credible returning-student context.",
      overlay: "AI homework coaching, grounded in real course material.",
      holdMs: 2500,
      actions: [
        { type: "navigate", path: "/app" },
        { type: "wait-for", target: "dashboard.heading" },
        { type: "checkpoint", name: "dashboard-ready" },
      ],
    },
    {
      id: "s02-open-mathematics",
      title: "Open Mathematics",
      purpose: "Enter Mathematics and show the complete three-source library.",
      overlay: "Matt already has three Mathematics resources ready.",
      holdMs: 3500,
      actions: [
        { type: "click", target: "dashboard.mathematics" },
        { type: "wait-for", target: "homework.question" },
        { type: "click", target: "homework.sourcesTab" },
        { type: "checkpoint", name: "mathematics-open" },
      ],
    },
    {
      id: "s03-choose-source",
      title: "Choose one course source",
      purpose: "Show deliberate, learner-controlled source selection.",
      overlay: "He chooses the source for this question.",
      holdMs: 4500,
      actions: [
        { type: "click", target: "homework.fractionsSource" },
        { type: "checkpoint", name: "source-selected" },
      ],
    },
    {
      id: "s04-ask-question",
      title: "Ask an imperfect question",
      purpose: "Show realistic learner input instead of a polished prompt.",
      overlay: "A real learner question — not a perfect prompt.",
      holdMs: 5000,
      actions: [
        {
          type: "fill",
          target: "homework.question",
          valueRef: "inputs.mattQuestion",
        },
        { type: "click", target: "homework.startChat" },
        { type: "checkpoint", name: "question-sent" },
      ],
    },
    {
      id: "s05-live-wait",
      title: "Live coaching generation",
      purpose: "Retain the real provider wait in the raw take.",
      overlay: "Live AI response · waiting time shortened",
      holdMs: 0,
      actions: [
        { type: "wait-for", target: "workbench.pendingReply", timeoutMs: 45000 },
        { type: "checkpoint", name: "provider-wait-start" },
      ],
    },
    {
      id: "s06-plan-and-hint",
      title: "Plan and first hint",
      purpose: "End on a source-grounded coaching response that withholds the answer.",
      overlay: "banban finds exercise b, then gives a plan and a first hint — not the answer.",
      holdMs: 17000,
      actions: [
        {
          type: "accept-coaching-response",
          target: "workbench.assistantReply",
          contractId: MATT_FRACTIONS_CONTRACT_ID,
          timeoutMs: 180000,
        },
        { type: "checkpoint", name: "accepted-response" },
      ],
    },
    {
      id: "s07-value-hold",
      title: "Value hold",
      purpose: "End without interaction on the strongest accepted response frame.",
      overlay: "Context-aware coaching, not answer dumping.",
      holdMs: 3000,
      actions: [{ type: "checkpoint", name: "value-hold" }],
    },
  ],
});

export const PORTFOLIO_DEMO_EDIT = Object.freeze({
  waitRetainSeconds: 2,
  minimumDurationSeconds: 42,
  maximumDurationSeconds: 48,
  width: 1920,
  height: 1080,
  fps: 30,
});
