import { createHmac } from "node:crypto";
import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createServerClient } from "@supabase/ssr";
import {
  FIXTURE,
  createAdminClient,
  env as fixtureEnv,
  resolveFixtureUserIds,
} from "./rls-fixture-shared.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const nextBinPath = path.join(
  repoRoot,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);
const buildIdPath = path.join(repoRoot, ".next", "BUILD_ID");
const requestPrefix = `smoke_billing_${Date.now()}`;
const requestTimeoutMs = 90000;
const webhookSecret = "smoke-billing-secret";
const providerSubscriptionId = "smoke-billing-subscription";
const providerCustomerId = "smoke-billing-customer";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeAssertionText(value) {
  return value
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureBuildArtifact() {
  try {
    await access(buildIdPath);
  } catch {
    throw new Error(
      "Missing .next build output. Run `npm run build` before `npm run smoke:billing`.",
    );
  }
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

function createCookieJar() {
  const cookies = new Map();

  return {
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

async function findAvailablePort(startPort = 3155) {
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
      if (error && typeof error === "object" && "code" in error) {
        if (error.code === "EADDRINUSE") {
          port += 1;
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error("Unable to find an open local port for the billing smoke server.");
}

async function waitForServerReady(baseUrl, childProcess) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (childProcess.exitCode !== null) {
      throw new Error(
        `Next server exited early with code ${childProcess.exitCode}.`,
      );
    }

    try {
      const response = await fetch(`${baseUrl}/auth`, {
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

async function startLocalServer() {
  await ensureBuildArtifact();

  const port = await findAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const childProcess = spawn(
    process.execPath,
    [nextBinPath, "start", "--hostname", "127.0.0.1", "--port", `${port}`],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        LEMON_SQUEEZY_API_KEY: "",
        LEMON_SQUEEZY_STORE_ID: "",
        LEMON_SQUEEZY_VARIANT_ID_FAMILY_MONTHLY: "",
        LEMON_SQUEEZY_WEBHOOK_SECRET: webhookSecret,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  childProcess.stdout.on("data", (chunk) => process.stderr.write(chunk));
  childProcess.stderr.on("data", (chunk) => process.stderr.write(chunk));

  await waitForServerReady(baseUrl, childProcess);

  return {
    baseUrl,
    childProcess,
  };
}

async function stopLocalServer(childProcess) {
  if (!childProcess || childProcess.exitCode !== null) {
    return;
  }

  childProcess.kill("SIGTERM");
  await wait(1000);

  if (childProcess.exitCode === null) {
    childProcess.kill("SIGKILL");
  }
}

function readErrorMessage(payload, fallbackMessage) {
  if (
    payload &&
    typeof payload === "object" &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return fallbackMessage;
}

function buildHttpClient(baseUrl, roleLabel) {
  const cookieJar = createCookieJar();
  let requestSequence = 0;

  return {
    async signInFixture(email) {
      const supabase = createServerClient(
        fixtureEnv.supabaseUrl,
        fixtureEnv.supabaseAnonKey,
        {
          cookies: {
            getAll() {
              const header = cookieJar.toHeader();

              if (!header) {
                return [];
              }

              return header.split("; ").map((segment) => {
                const separatorIndex = segment.indexOf("=");

                return {
                  name: segment.slice(0, separatorIndex),
                  value: segment.slice(separatorIndex + 1),
                };
              });
            },
            setAll(cookiesToSet) {
              const response = new Response(null);

              for (const cookie of cookiesToSet) {
                response.headers.append(
                  "set-cookie",
                  `${cookie.name}=${cookie.value}`,
                );
              }

              cookieJar.applyResponseCookies(response);
            },
          },
        },
      );
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: fixtureEnv.fixturePassword,
      });

      if (error) {
        throw new Error(`Fixture ${roleLabel} sign-in failed: ${error.message}`);
      }
    },
    async requestJson(pathname, init = {}) {
      requestSequence += 1;
      const requestId = `${requestPrefix}_${roleLabel}_${requestSequence}`;
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
      const payload = await response.json().catch(() => null);

      return {
        requestId,
        response,
        payload,
      };
    },
    async requestText(pathname, init = {}) {
      requestSequence += 1;
      const requestId = `${requestPrefix}_${roleLabel}_${requestSequence}`;
      const headers = new Headers(init.headers ?? {});

      headers.set("x-request-id", requestId);

      if (cookieJar.toHeader()) {
        headers.set("cookie", cookieJar.toHeader());
      }

      const response = await fetch(`${baseUrl}${pathname}`, {
        ...init,
        headers,
        signal: AbortSignal.timeout(requestTimeoutMs),
      });

      cookieJar.applyResponseCookies(response);
      const text = await response.text();

      return {
        requestId,
        response,
        text,
      };
    },
  };
}

async function cleanupSubscription(adminClient) {
  await adminClient
    .from("subscriptions")
    .delete()
    .eq("provider_subscription_id", providerSubscriptionId);
}

async function main() {
  const adminClient = createAdminClient();
  const fixtureUserIds = await resolveFixtureUserIds(adminClient);
  assert(fixtureUserIds.parent, "Missing fixture parent user id.");

  let startedServer = false;
  let childProcess = null;

  try {
    await cleanupSubscription(adminClient);
    const server = await startLocalServer();
    startedServer = true;
    childProcess = server.childProcess;

    const parent = buildHttpClient(server.baseUrl, "parent");
    await parent.signInFixture(FIXTURE.emails.parent);

    const checkoutResult = await parent.requestJson("/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({
        planKey: "family_monthly",
      }),
    });

    assert(
      checkoutResult.response.status === 503,
      `Expected checkout to fail with 503 while Lemon checkout config is blank, got ${checkoutResult.response.status}.`,
    );
    assert(
      normalizeAssertionText(
        readErrorMessage(checkoutResult.payload, "unknown error"),
      ).includes("billing checkout is not configured yet"),
      "Checkout route did not return the expected provider-config failure message.",
    );

    const now = new Date();
    const renewsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const webhookPayload = JSON.stringify({
      meta: {
        event_name: "subscription_created",
        custom_data: {
          payer_user_id: fixtureUserIds.parent,
          plan_key: "family_monthly",
        },
      },
      data: {
        type: "subscriptions",
        id: providerSubscriptionId,
        attributes: {
          customer_id: providerCustomerId,
          variant_id: "smoke-variant",
          status: "active",
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          renews_at: renewsAt.toISOString(),
          trial_ends_at: null,
          ends_at: null,
        },
      },
    });
    const signature = createHmac("sha256", webhookSecret)
      .update(webhookPayload)
      .digest("hex");
    const webhookResponse = await fetch(
      `${server.baseUrl}/api/billing/webhooks/lemonsqueezy`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": `${requestPrefix}_webhook`,
          "x-signature": signature,
        },
        body: webhookPayload,
        signal: AbortSignal.timeout(requestTimeoutMs),
      },
    );
    const webhookPayloadJson = await webhookResponse.json();

    assert(webhookResponse.ok, "Billing webhook route returned a non-OK response.");
    assert(
      webhookPayloadJson?.ok === true &&
        webhookPayloadJson?.data?.handled === true &&
        webhookPayloadJson?.data?.status === "active",
      "Billing webhook route did not report a handled active subscription sync.",
    );

    const { data: persistedSubscription, error: subscriptionError } = await adminClient
      .from("subscriptions")
      .select("payer_user_id, plan_key, status, provider_subscription_id")
      .eq("provider_subscription_id", providerSubscriptionId)
      .maybeSingle();

    if (subscriptionError) {
      throw subscriptionError;
    }

    assert(persistedSubscription, "Billing webhook did not persist a subscription row.");
    assert(
      persistedSubscription.payer_user_id === fixtureUserIds.parent,
      "Persisted billing row was not linked back to the fixture parent.",
    );
    assert(
      persistedSubscription.plan_key === "family_monthly" &&
        persistedSubscription.status === "active",
      "Persisted billing row did not keep the expected plan or status.",
    );

    const parentDashboard = await parent.requestText("/app");
    assert(parentDashboard.response.ok, "Parent dashboard did not render after billing sync.");
    assert(
      normalizeAssertionText(parentDashboard.text).includes("plan family_monthly"),
      "Parent dashboard did not surface the synced billing plan.",
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl: server.baseUrl,
          startedServer,
          checks: [
            "checkout route fails cleanly while Lemon checkout config is blank",
            "signed webhook persisted the subscription row",
            "parent dashboard surfaced the synced billing state",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    await cleanupSubscription(adminClient).catch(() => {});
    await stopLocalServer(childProcess);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
