"use client";

import { useSyncExternalStore } from "react";

export type LandingAudience = "student" | "parent" | "tutor";

export const landingAudienceLabels: Array<{
  label: string;
  value: LandingAudience;
}> = [
  { label: "Student", value: "student" },
  { label: "Parent", value: "parent" },
  { label: "Tutor", value: "tutor" },
];

const DEFAULT_AUDIENCE: LandingAudience = "parent";

let currentAudience: LandingAudience = DEFAULT_AUDIENCE;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);

  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return currentAudience;
}

function getServerSnapshot() {
  return DEFAULT_AUDIENCE;
}

export function setLandingAudience(nextAudience: LandingAudience) {
  if (nextAudience === currentAudience) {
    return;
  }

  currentAudience = nextAudience;
  listeners.forEach((listener) => listener());
}

export function useLandingAudience() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
