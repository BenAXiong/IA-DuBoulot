import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(repoRoot, "fixtures/homework-samples/manifest.json");

const STOPWORDS = new Set([
  "avec",
  "dans",
  "des",
  "du",
  "est",
  "les",
  "pour",
  "que",
  "sur",
  "the",
  "and",
  "for",
  "with",
]);

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function tokenize(value) {
  const tokens = normalize(value).match(/[\p{L}\p{N}]{3,}/gu) ?? [];
  return Array.from(new Set(tokens.filter((token) => !STOPWORDS.has(token))));
}

function splitByPageMarkers(text) {
  const markers = Array.from(
    text.matchAll(/(^|\n)\s*page\s+(\d{1,4})\s*(?=\n|$)/giu),
  ).map((match) => ({
    index: match.index ?? 0,
    length: match[0].length,
    page: Number(match[2]),
  }));

  return markers
    .map((marker, index) => {
      const next = markers[index + 1] ?? null;
      return {
        page: marker.page,
        content: text.slice(marker.index + marker.length, next?.index ?? text.length).trim(),
      };
    })
    .filter((page) => page.content);
}

function scorePage(page, queryTokens) {
  const content = normalize(page.content);

  return queryTokens.reduce((score, token) => {
    const matches = content.match(new RegExp(token, "gu")) ?? [];
    return score + matches.length;
  }, 0);
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const fixtures = manifest.retrieval_fixtures ?? [];
  const failures = [];

  for (const fixture of fixtures) {
    const fixtureText = await readFile(
      path.join(repoRoot, fixture.extracted_text_path),
      "utf8",
    );
    const queryTokens = tokenize(fixture.expected_query);
    const pages = splitByPageMarkers(fixtureText)
      .map((page) => ({
        ...page,
        score: scorePage(page, queryTokens),
      }))
      .sort((a, b) => b.score - a.score || a.page - b.page);
    const topPage = pages[0] ?? null;
    const normalizedTopContent = normalize(topPage?.content ?? "");
    const expectedMarker = normalize(fixture.expected_marker);

    if (
      !topPage ||
      topPage.page < fixture.expected_top_page_min ||
      !normalizedTopContent.includes(expectedMarker)
    ) {
      failures.push({
        fixture_key: fixture.fixture_key,
        expected_top_page_min: fixture.expected_top_page_min,
        expected_marker: fixture.expected_marker,
        actual_top_page: topPage?.page ?? null,
        actual_top_score: topPage?.score ?? null,
      });
    }
  }

  if (failures.length > 0) {
    console.error("Subject-resource retrieval fixture failed:");
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }

  console.log(`Subject-resource retrieval fixtures passed: ${fixtures.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
