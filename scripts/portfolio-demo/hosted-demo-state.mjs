import { createClient } from "@supabase/supabase-js";
import { createSmokeHttpClient, expectOkJson } from "../smoke-app-harness.mjs";

export const PORTFOLIO_DEMO_TAG = "portfolio_demo_matt_v1";
export const PORTFOLIO_DEMO_SUBJECT = "mathematiques";

function sortRows(rows, key = "id") {
  return [...rows].sort((left, right) =>
    String(left[key]).localeCompare(String(right[key])),
  );
}

function comparableUsage(rows) {
  return sortRows(
    rows.map((row) => ({
      period_start: row.period_start,
      period_end: row.period_end,
      sessions_count: row.sessions_count,
      uploads_count: row.uploads_count,
      assistant_message_count: row.assistant_message_count,
      input_tokens: row.input_tokens,
      output_tokens: row.output_tokens,
    })),
    "period_start",
  );
}

export function createHostedDemoClients(config) {
  const admin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const http = createSmokeHttpClient({
    baseUrl: config.appOrigin,
    requestPrefix: `portfolio_record_${Date.now()}`,
    roleLabel: "Matt portfolio recorder",
    requestTimeoutMs: 180000,
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
    signInErrorLabel: "the tagged Matt portfolio demo account",
    assertAuthCookie: true,
  });
  return { admin, http };
}

export async function authenticateTaggedMatt({ admin, http, email, password }) {
  await http.signInPassword(email, password);
  const payload = expectOkJson(
    await http.requestJson("/api/auth/me"),
    "Matt's authenticated profile route failed",
  );
  const studentUserId = payload.data?.appUser?.id;
  if (!studentUserId) throw new Error("Matt's profile omitted its user id.");
  const { data, error } = await admin.auth.admin.getUserById(studentUserId);
  if (error) throw error;
  if (
    data.user?.email?.toLowerCase() !== email.toLowerCase() ||
    data.user?.user_metadata?.portfolio_demo_tag !== PORTFOLIO_DEMO_TAG
  ) {
    throw new Error("Refusing to record because the account is not the tagged Matt demo identity.");
  }
  return studentUserId;
}

export function browserCookies(http, appOrigin) {
  const target = new URL(appOrigin);
  return http.cookieJar.getAll().map(({ name, value }) => ({
    name,
    value,
    domain: target.hostname,
    path: "/",
    httpOnly: true,
    secure: target.protocol === "https:",
    sameSite: "Lax",
  }));
}

export async function loadDemoBaseline(admin, studentUserId) {
  const [conversations, resources, usage] = await Promise.all([
    admin.from("conversations").select("id,title,subject_tag,status,last_message_at,completed_at,updated_at").eq("student_user_id", studentUserId),
    admin.from("subject_resources").select("id,subject_tag,original_filename,sha256,extraction_status,updated_at").eq("student_user_id", studentUserId),
    admin.from("usage_counters").select("*").eq("student_user_id", studentUserId),
  ]);
  for (const result of [conversations, resources, usage]) if (result.error) throw result.error;
  return {
    conversations: sortRows(conversations.data ?? []),
    resources: sortRows(resources.data ?? []),
    usage: sortRows(usage.data ?? [], "period_start"),
  };
}

export async function removeDemoConversation(admin, conversationId) {
  if (!conversationId) return;
  for (const table of ["audit_logs", "moderation_events"]) {
    const result = await admin.from(table).delete().eq("conversation_id", conversationId);
    if (result.error) throw result.error;
  }
  const result = await admin.from("conversations").delete().eq("id", conversationId);
  if (result.error) throw result.error;
}

export async function restoreAndVerifyBaseline(admin, studentUserId, baseline) {
  const current = await loadDemoBaseline(admin, studentUserId);
  const baselineKeys = new Set(baseline.usage.map((row) => `${row.period_start}:${row.period_end}`));
  for (const row of current.usage) {
    if (baselineKeys.has(`${row.period_start}:${row.period_end}`)) continue;
    const result = await admin.from("usage_counters").delete().eq("id", row.id).eq("student_user_id", studentUserId);
    if (result.error) throw result.error;
  }
  if (baseline.usage.length) {
    const result = await admin.from("usage_counters").upsert(baseline.usage, {
      onConflict: "student_user_id,period_start,period_end",
    });
    if (result.error) throw result.error;
  }
  const restored = await loadDemoBaseline(admin, studentUserId);
  if (JSON.stringify(restored.conversations) !== JSON.stringify(baseline.conversations)) {
    throw new Error("Matt's conversation baseline was not restored after recording.");
  }
  if (JSON.stringify(restored.resources) !== JSON.stringify(baseline.resources)) {
    throw new Error("Matt's resource baseline changed during recording.");
  }
  if (JSON.stringify(comparableUsage(restored.usage)) !== JSON.stringify(comparableUsage(baseline.usage))) {
    throw new Error("Matt's visible usage counters were not restored after recording.");
  }
  return { conversationsPreserved: restored.conversations.length, resourcesPreserved: restored.resources.length, usageCountersRestored: true };
}
