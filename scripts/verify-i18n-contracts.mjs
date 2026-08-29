import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const repoRoot = process.cwd();

async function readRepoFile(relativePath) {
  return readFile(path.join(repoRoot, relativePath), "utf8");
}

function parseHexColor(value) {
  const normalized = value.replace("#", "");

  return [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16));
}

function relativeLuminance(rgb) {
  const [red, green, blue] = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function composite(foreground, background, alpha) {
  return foreground.map((channel, index) =>
    Math.round(channel * alpha + background[index] * (1 - alpha)),
  );
}

function extractThemeBlock(css, selector) {
  const selectorIndex = css.indexOf(selector);
  assert.notEqual(selectorIndex, -1, "Missing theme selector: " + selector);
  const openBrace = css.indexOf("{", selectorIndex);
  const closeBrace = css.indexOf("}", openBrace);

  return css.slice(openBrace + 1, closeBrace);
}

function readHexVariable(block, variableName) {
  const match = block.match(
    new RegExp(`--${variableName}:\\s*(#[0-9a-f]{6});`, "i"),
  );
  assert.ok(match, "Missing hex theme variable --" + variableName + ".");

  return parseHexColor(match[1]);
}

function readRgbaVariable(block, variableName) {
  const match = block.match(
    new RegExp(
      `--${variableName}:\\s*rgba\\((\\d+),\\s*(\\d+),\\s*(\\d+),\\s*([0-9.]+)\\);`,
      "i",
    ),
  );
  assert.ok(match, "Missing rgba theme variable --" + variableName + ".");

  return {
    alpha: Number(match[4]),
    rgb: match.slice(1, 4).map(Number),
  };
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
  const replyModeSwitch = await readRepoFile(
    "components/dashboard/student/student-reply-mode-switch.tsx",
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
  assert.equal(
    replyModeSwitch.includes("className=\"inline-flex h-8"),
    false,
    "Student reply-mode switch still exposes a 32px target.",
  );
  assert.match(
    globals,
    /\.theme-toggle--minimal\s*\{[^}]*min-height:\s*2\.75rem;[^}]*min-width:\s*2\.75rem;/s,
    "Minimal theme/language controls must keep a 44px target.",
  );
  assert.match(
    globals,
    /\.student-chat-textarea:focus-visible\s*\{[^}]*box-shadow:\s*inset 0 -2px 0 var\(--accent\)/s,
    "Borderless student textareas must keep a visible keyboard-focus indicator.",
  );

  for (const [name, source] of [
    ["conversation composer", composer],
    ["subject quick-start", quickStart],
    ["reply-mode switch", replyModeSwitch],
  ]) {
    assert.equal(
      source.includes("focus-visible:shadow-none"),
      false,
      name + " must not suppress the shared keyboard-focus ring.",
    );
  }

  assert.match(
    globals,
    /@media \(prefers-reduced-motion: reduce\)[^]*\.brand-mark,[^]*\.student-pending-shimmer[^]*animation:\s*none;/s,
    "Brand and pending-state animations must honor reduced motion.",
  );

  for (const [name, selector] of [
    ["light", ":root"],
    ["dark", 'html[data-theme="dark"]'],
    ["smooth/custom", 'html[data-theme="smooth"]'],
    ["warm", 'html[data-theme="warm"]'],
  ]) {
    const block = extractThemeBlock(globals, selector);
    const background = readHexVariable(block, "background");
    const muted = readRgbaVariable(block, "ink-muted");
    const ratio = contrastRatio(composite(muted.rgb, background, muted.alpha), background);

    assert.ok(
      ratio >= 4.5,
      `${name} muted text contrast is ${ratio.toFixed(2)}:1; expected at least 4.5:1.`,
    );
  }
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
        "student controls preserve keyboard focus and reduced-motion behavior",
        "shared theme muted text keeps at least 4.5:1 contrast",
      ],
    },
    null,
    2,
  ),
);
