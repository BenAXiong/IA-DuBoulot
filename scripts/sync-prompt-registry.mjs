import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const manifestPath = path.join(
  repoRoot,
  "lib",
  "server",
  "ai",
  "prompt-registry.json",
);
const sharedPromptPath = path.join(
  repoRoot,
  "lib",
  "server",
  "ai",
  "prompts",
  "shared.ts",
);
const outputPath = path.join(repoRoot, "docs", "ai_prompt_registry_v1.md");

function extractVersionValue(sharedPromptSource, versionConst) {
  const pattern = new RegExp(
    `export const ${versionConst} = "([^"]+)";`,
  );
  const match = sharedPromptSource.match(pattern);
  if (!match) {
    throw new Error(`Unable to find ${versionConst} in shared.ts`);
  }

  return match[1];
}

function buildMarkdown({ families, sharedPromptSource }) {
  const lines = [
    "# AI Prompt Registry V1",
    "",
    "Related: [README](../README.md) | [AI ops and economics V1](ai_ops_economics_v1.md) | [Service interfaces](service_interfaces.md) | [Student workbench V1](student_workbench_v1.md) | [Decision log](decision_log.md) | [Pilot_todo](pilot_todo.md)",
    "",
    "## Purpose",
    "",
    "This document is the human-review index for the current AI prompt surface.",
    "",
    "Use it to answer four questions quickly:",
    "",
    "- which prompt families currently exist",
    "- which route or workflow calls each prompt",
    "- what each prompt is trying to do and what output it is expected to return",
    "- which code file and version constant must be changed when behavior evolves",
    "",
    "The markdown below is generated from `lib/server/ai/prompt-registry.json` plus the live version constants in `lib/server/ai/prompts/shared.ts`.",
    "",
    "## Current Families",
    "",
    "| Family | Version | Builder | Routes | Aim | Outcome |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const family of families) {
    const version = extractVersionValue(sharedPromptSource, family.versionConst);
    lines.push(
      `| \`${family.id}\` | \`${version}\` | \`${family.builderFunction}\` in \`${family.builderFile}\` | ${family.routes.join("<br>")} | ${family.aim} | ${family.outcome} |`,
    );
  }

  lines.push("", "## Detailed Inventory", "");

  for (const family of families) {
    const version = extractVersionValue(sharedPromptSource, family.versionConst);
    lines.push(`### ${family.title}`, "");
    lines.push(`- Family ID: \`${family.id}\``);
    lines.push(`- Current version: \`${version}\``);
    lines.push(`- Version constant: \`${family.versionConst}\``);
    lines.push(`- Builder: \`${family.builderFunction}\` in \`${family.builderFile}\``);
    lines.push(`- Service method: \`${family.serviceMethod}\``);
    lines.push(`- Routes or workflow: ${family.routes.join("; ")}`);
    lines.push(`- Aim: ${family.aim}`);
    lines.push(`- Expected outcome: ${family.outcome}`);
    lines.push(
      `- Primary docs: ${family.docs.map((doc) => `\`${doc}\``).join(", ")}`,
    );
    lines.push("");
  }

  lines.push("## Editing Workflow", "");
  lines.push("1. Edit the actual prompt builder in `lib/server/ai/prompts/...`.");
  lines.push(
    "2. If the prompt family, route ownership, or expected output changed, update `lib/server/ai/prompt-registry.json`.",
  );
  lines.push(
    "3. If the prompt logic meaningfully changed, update `docs/decision_log.md` and the relevant product or ops doc in the same slice.",
  );
  lines.push("4. Run `npm run sync:prompt-registry`.");
  lines.push(
    "5. If you want a non-mutating guard, run `npm run verify:prompt-registry` before commit.",
  );
  lines.push("");
  lines.push("## Rules", "");
  lines.push(
    "- Keep prompt-family metadata in the registry JSON, not scattered across chat notes.",
  );
  lines.push(
    "- Keep version constants in `lib/server/ai/prompts/shared.ts`, not hard-coded in route handlers.",
  );
  lines.push(
    "- Treat this registry doc as generated output. Do not hand-edit it; regenerate it.",
  );
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function main() {
  const checkMode = process.argv.includes("--check");
  const [manifestRaw, sharedPromptSource] = await Promise.all([
    fs.readFile(manifestPath, "utf8"),
    fs.readFile(sharedPromptPath, "utf8"),
  ]);
  const manifest = JSON.parse(manifestRaw);
  const markdown = buildMarkdown({
    families: manifest.families,
    sharedPromptSource,
  });

  if (checkMode) {
    const existing = await fs.readFile(outputPath, "utf8").catch(() => null);
    if (existing !== markdown) {
      throw new Error(
        "Prompt registry doc is out of date. Run `npm run sync:prompt-registry`.",
      );
    }
    return;
  }

  await fs.writeFile(outputPath, markdown, "utf8");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
