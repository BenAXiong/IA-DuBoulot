import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const repoRoot = process.cwd();

async function readRepoFile(relativePath) {
  return readFile(path.join(repoRoot, relativePath), "utf8");
}

async function loadSummarySelectionModule() {
  const source = await readRepoFile("lib/oversight/summary-selection.ts");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "summary-selection.ts",
  });
  const moduleUrl =
    "data:text/javascript;base64," +
    Buffer.from(transpiled.outputText).toString("base64");

  return import(moduleUrl);
}

function verifySummarySelection(selectSummaryForLanguage) {
  const variants = [
    { language_code: "fr", marker: "fr" },
    { language_code: "en", marker: "en" },
    { language_code: "zh", marker: "zh" },
  ];

  for (const languageCode of ["fr", "en", "zh"]) {
    assert.equal(
      selectSummaryForLanguage(variants, languageCode)?.marker,
      languageCode,
      "Parent summary should prefer " + languageCode + ".",
    );
  }

  assert.equal(
    selectSummaryForLanguage(variants.slice(0, 2), "zh")?.marker,
    "fr",
    "Missing preferred parent summary should fall back to French.",
  );
  assert.equal(
    selectSummaryForLanguage(variants.slice(1), "fr")?.marker,
    "en",
    "Missing French parent summary should use the first available variant.",
  );
  assert.equal(
    selectSummaryForLanguage([], "zh"),
    null,
    "An empty parent summary set should stay empty.",
  );
}

async function verifyLocalizedAccessibleLabels() {
  const targets = [
    "components/layout/public-header.tsx",
    "components/pricing/public-pricing-page.tsx",
    "components/landing/public-landing-page.tsx",
    "components/layout/student-app-shell.tsx",
    "components/dashboard/student/student-subject-quick-start.tsx",
    "components/dashboard/student/student-conversation-workbench.tsx",
  ];
  const forbiddenLiterals = [
    "aria-label=\"Landing audience\"",
    "aria-label=\"Pricing audience\"",
    "aria-label=\"Close oversight details\"",
    "aria-label=\"Resize side rail\"",
    "aria-label=\"Subject workspace\"",
    ">Expand sidebar<",
    ">Collapse sidebar<",
  ];

  for (const relativePath of targets) {
    const source = await readRepoFile(relativePath);

    for (const literal of forbiddenLiterals) {
      assert.equal(
        source.includes(literal),
        false,
        relativePath + " still contains English-only accessible copy: " + literal,
      );
    }
  }
}

async function verifyCriticalTouchTargets() {
  const composer = await readRepoFile(
    "components/dashboard/student/student-conversation-composer.tsx",
  );
  const quickStart = await readRepoFile(
    "components/dashboard/student/student-subject-quick-start.tsx",
  );
  const shell = await readRepoFile("components/layout/student-app-shell.tsx");
  const globals = await readRepoFile("app/globals.css");

  for (const [name, source] of [
    ["conversation composer", composer],
    ["subject quick-start", quickStart],
  ]) {
    assert.equal(
      source.includes("className=\"inline-flex h-8 w-8"),
      false,
      name + " still exposes a 32px primary control.",
    );
  }

  assert.equal(
    shell.includes("className=\"inline-flex h-8 w-8 shrink-0"),
    false,
    "Student shell still exposes a 32px navigation control.",
  );
  assert.match(
    globals,
    /\.theme-toggle--minimal\s*\{[^}]*min-height:\s*2\.75rem;[^}]*min-width:\s*2\.75rem;/s,
    "Minimal theme/language controls must keep a 44px target.",
  );
}

const { selectSummaryForLanguage } = await loadSummarySelectionModule();

verifySummarySelection(selectSummaryForLanguage);
await verifyLocalizedAccessibleLabels();
await verifyCriticalTouchTargets();

console.info(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "parent summaries prefer the adult UI language",
        "parent summaries fall back to French, then the first available variant",
        "shared-route accessible labels are localized",
        "critical student controls keep 44px touch targets",
      ],
    },
    null,
    2,
  ),
);
