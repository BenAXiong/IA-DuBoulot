import { createLocatorAdapter } from "./locators.mjs";
import { PORTFOLIO_DEMO_RESOURCE } from "./storyboard.mjs";

export function createPortfolioRecorderLocators() {
  return createLocatorAdapter({
    "dashboard.heading": (page) =>
      page.getByRole("heading", { name: "Where should we start?" }),
    "dashboard.mathematics": (page) =>
      page.getByRole("link", { name: /^Mathematics(?:\s|$)/ }).first(),
    "homework.question": (page) =>
      page.getByPlaceholder("Ask anything about this homework..."),
    "homework.sourcesTab": (page) =>
      page.getByRole("tab", { name: "Sources" }),
    "homework.fractionsSource": (page) =>
      page.getByRole("checkbox", {
        name: `Use ${PORTFOLIO_DEMO_RESOURCE} for the first message in the next chat`,
      }),
    "homework.startChat": (page) =>
      page.getByRole("button", { name: "Start chat" }),
    "workbench.pendingReply": (page) => page.getByText("Let me see..."),
    "workbench.assistantReply": (page) =>
      page.locator("article").filter({ has: page.locator(".brand-mark--mini") }).last(),
  });
}
