export function sanitizeRelativeRedirectPath(
  value: string | null | undefined,
  fallback = "/onboarding",
) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim();

  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return fallback;
  }

  return normalized;
}
