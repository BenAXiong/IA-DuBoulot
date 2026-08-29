import { createHmac } from "node:crypto";
import {
  FIXTURE,
  createAdminClient,
  env as fixtureEnv,
  resolveFixtureUserIds,
} from "./rls-fixture-shared.mjs";
import {
  createSmokeHttpClient,
  readErrorMessage,
  startLocalNextServer,
  stopLocalNextServer,
} from "./smoke-app-harness.mjs";

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

function startLocalServer() {
  return startLocalNextServer({
    smokeCommand: "npm run smoke:billing",
    startPort: 3155,
    environment: {
      LEMON_SQUEEZY_API_KEY: "",
      LEMON_SQUEEZY_STORE_ID: "",
      LEMON_SQUEEZY_VARIANT_ID_FAMILY_MONTHLY: "",
      LEMON_SQUEEZY_WEBHOOK_SECRET: webhookSecret,
    },
  });
}

function stopLocalServer(childProcess) {
  return stopLocalNextServer(childProcess);
}

function buildHttpClient(baseUrl, roleLabel) {
  return createSmokeHttpClient({
    baseUrl,
    requestPrefix,
    roleLabel,
    supabaseUrl: fixtureEnv.supabaseUrl,
    supabaseAnonKey: fixtureEnv.supabaseAnonKey,
    fixturePassword: fixtureEnv.fixturePassword,
    signInErrorLabel: `fixture ${roleLabel}`,
  });
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
