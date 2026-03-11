"use client";

import type { AnalyticsEventInput } from "@/lib/analytics/types";
import { isAnalyticsEnabled } from "@/lib/feature-flags";

export function trackClientEvent(event: AnalyticsEventInput) {
  if (!isAnalyticsEnabled() || typeof window === "undefined") {
    return;
  }

  const body = JSON.stringify(event);

  if (typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(
      "/api/telemetry/events",
      new Blob([body], { type: "application/json" }),
    );
    return;
  }

  void fetch("/api/telemetry/events", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body,
    keepalive: true,
  });
}
