import process from "node:process";
import {
  startLocalNextServer,
  stopLocalNextServer,
} from "./smoke-app-harness.mjs";

const routes = [
  {
    path: "/",
    expected: {
      fr: "Une façon plus sûre de laisser l'IA aider aux devoirs.",
      en: "A safer way to let AI help with homework.",
      zh: "讓 AI 協助作業的更安全方式。",
    },
  },
  {
    path: "/pricing",
    expected: {
      fr: "Choisis l'accès qui accompagne ton rythme.",
      en: "Choose the support that fits your learning rhythm.",
      zh: "選擇適合學習節奏的方案。",
    },
  },
  {
    path: "/auth",
    expected: {
      fr: "Se connecter",
      en: "Sign in",
      zh: "登入",
    },
  },
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeHtmlText(html) {
  return html
    .replace(/<!--[^]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  let childProcess = null;
  let baseUrl = process.env.SMOKE_APP_URL ?? null;

  try {
    if (!baseUrl) {
      const server = await startLocalNextServer({
        smokeCommand: "npm run smoke:public-localization",
        startPort: 3165,
      });
      baseUrl = server.baseUrl;
      childProcess = server.childProcess;
    }

    const checks = [];

    for (const route of routes) {
      for (const language of ["fr", "en", "zh"]) {
        const url = `${baseUrl}${route.path}?lang=${language}`;
        const response = await fetch(url, {
          redirect: "manual",
          signal: AbortSignal.timeout(30000),
        });
        const html = await response.text();
        const visibleText = normalizeHtmlText(html);

        assert(response.ok, `${url} returned ${response.status}.`);
        assert(
          new RegExp(`<html[^>]+lang=["']${language}["']`).test(html),
          `${url} did not render html lang=${language}.`,
        );
        assert(
          visibleText.includes(route.expected[language]),
          `${url} did not render its localized route anchor.`,
        );

        checks.push(`${language} ${route.path}`);
      }
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          checks,
        },
        null,
        2,
      ),
    );
  } finally {
    await stopLocalNextServer(childProcess);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
