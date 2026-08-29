import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createServerClient } from "@supabase/ssr";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptsDirectory, "..");
const nextBinPath = path.join(
  repoRoot,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);
const buildIdPath = path.join(repoRoot, ".next", "BUILD_ID");

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function parseSetCookieHeader(headerValue) {
  const firstSegment = headerValue.split(";")[0] ?? "";
  const separatorIndex = firstSegment.indexOf("=");

  if (separatorIndex <= 0) {
    return null;
  }

  return {
    name: firstSegment.slice(0, separatorIndex).trim(),
    value: firstSegment.slice(separatorIndex + 1),
  };
}

export function createCookieJar() {
  const cookies = new Map();

  return {
    getAll() {
      return Array.from(cookies.entries()).map(([name, value]) => ({
        name,
        value,
      }));
    },
    setAll(cookiesToSet) {
      for (const cookie of cookiesToSet) {
        if (!cookie?.name) {
          continue;
        }

        if (!cookie.value) {
          cookies.delete(cookie.name);
          continue;
        }

        cookies.set(cookie.name, cookie.value);
      }
    },
    applyResponseCookies(response) {
      const getSetCookie = response.headers.getSetCookie?.bind(response.headers);
      const setCookieHeaders = getSetCookie
        ? getSetCookie()
        : response.headers.get("set-cookie")
          ? [response.headers.get("set-cookie")]
          : [];

      for (const headerValue of setCookieHeaders) {
        if (!headerValue) {
          continue;
        }

        const parsed = parseSetCookieHeader(headerValue);

        if (!parsed) {
          continue;
        }

        if (!parsed.value) {
          cookies.delete(parsed.name);
          continue;
        }

        cookies.set(parsed.name, parsed.value);
      }
    },
    toHeader() {
      return Array.from(cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
    },
  };
}

async function findAvailablePort(startPort) {
  let port = startPort;

  while (port < startPort + 50) {
    try {
      await new Promise((resolve, reject) => {
        const server = net.createServer();

        server.once("error", reject);
        server.listen(port, "127.0.0.1", () => {
          server.close((closeError) => {
            if (closeError) {
              reject(closeError);
              return;
            }

            resolve(null);
          });
        });
      });

      return port;
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "EADDRINUSE"
      ) {
        port += 1;
        continue;
      }

      throw error;
    }
  }

  throw new Error("Unable to find an open local port for the smoke server.");
}

async function waitForServerReady(baseUrl, childProcess, readyPath) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (childProcess.exitCode !== null) {
      throw new Error(
        `Next server exited early with code ${childProcess.exitCode}.`,
      );
    }

    try {
      const response = await fetch(`${baseUrl}${readyPath}`, {
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
      });

      if (response.status >= 200) {
        return;
      }
    } catch {
      // Retry until ready.
    }

    await wait(1000);
  }

  throw new Error("Timed out while waiting for the local Next server.");
}

export async function startLocalNextServer({
  smokeCommand,
  startPort,
  readyPath = "/auth",
  environment = {},
}) {
  try {
    await access(buildIdPath);
  } catch {
    throw new Error(
      `Missing .next build output. Run \`npm run build\` before \`${smokeCommand}\`.`,
    );
  }

  const port = await findAvailablePort(startPort);
  const baseUrl = `http://127.0.0.1:${port}`;
  const childProcess = spawn(
    process.execPath,
    [nextBinPath, "start", "--hostname", "127.0.0.1", "--port", `${port}`],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        ...environment,
        NEXT_PUBLIC_APP_URL: environment.NEXT_PUBLIC_APP_URL ?? baseUrl,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  childProcess.stdout.on("data", (chunk) => process.stderr.write(chunk));
  childProcess.stderr.on("data", (chunk) => process.stderr.write(chunk));

  await waitForServerReady(baseUrl, childProcess, readyPath);

  return { baseUrl, childProcess };
}

export async function stopLocalNextServer(childProcess) {
  if (!childProcess || childProcess.exitCode !== null) {
    return;
  }

  childProcess.kill("SIGTERM");
  await wait(1000);

  if (childProcess.exitCode === null) {
    childProcess.kill("SIGKILL");
    await wait(500);
  }
}

function defaultRequestId({ prefix, roleLabel, sequence }) {
  return [prefix, roleLabel, sequence].filter(Boolean).join("_");
}

export function createSmokeHttpClient({
  baseUrl,
  requestPrefix,
  roleLabel,
  requestTimeoutMs = 90000,
  supabaseUrl,
  supabaseAnonKey,
  fixturePassword,
  signInErrorLabel = roleLabel || "smoke user",
  requestIdFactory = defaultRequestId,
  assertAuthCookie = false,
}) {
  const cookieJar = createCookieJar();
  let requestSequence = 0;

  async function request(pathname, init, responseType) {
    requestSequence += 1;
    const requestId = requestIdFactory({
      pathname,
      prefix: requestPrefix,
      roleLabel,
      sequence: requestSequence,
    });
    const headers = new Headers(init.headers ?? {});

    headers.set("x-request-id", requestId);

    if (cookieJar.toHeader()) {
      headers.set("cookie", cookieJar.toHeader());
    }

    if (
      init.body !== undefined &&
      !headers.has("content-type") &&
      typeof init.body === "string"
    ) {
      headers.set("content-type", "application/json");
    }

    const response = await fetch(`${baseUrl}${pathname}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

    cookieJar.applyResponseCookies(response);

    return {
      requestId,
      response,
      location: response.headers.get("location"),
      ...(responseType === "json"
        ? { payload: await response.json().catch(() => null) }
        : { text: await response.text() }),
    };
  }

  const client = {
    cookieJar,
    async signInPassword(email, password) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: cookieJar,
      });
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(`Sign-in failed for ${signInErrorLabel}: ${error.message}`);
      }

      if (assertAuthCookie && !cookieJar.toHeader().includes("sb-")) {
        throw new Error(
          "Supabase SSR auth cookie was not created after fixture sign-in.",
        );
      }
    },
    async signInFixture(email) {
      await client.signInPassword(email, fixturePassword);
    },
    requestJson(pathname, init = {}) {
      return request(pathname, init, "json");
    },
    requestText(pathname, init = {}) {
      return request(pathname, init, "text");
    },
  };

  return client;
}

export function readErrorMessage(payload, fallbackMessage) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return fallbackMessage;
}

export function expectOkJson(result, fallbackMessage) {
  if (!result.response.ok) {
    throw new Error(readErrorMessage(result.payload, fallbackMessage));
  }

  if (!result.payload || typeof result.payload !== "object" || result.payload.ok !== true) {
    throw new Error(`${fallbackMessage}: route returned an unexpected payload.`);
  }

  return result.payload;
}
