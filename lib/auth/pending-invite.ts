export const PENDING_INVITE_COOKIE_NAME = "ia_pending_invite";
export const PENDING_INVITE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 6;

export function sanitizePendingInviteToken(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";

  if (!normalized || normalized.length < 16 || normalized.length > 256) {
    return null;
  }

  return normalized;
}

export function persistPendingInviteCookie(token: string) {
  if (typeof document === "undefined") {
    return;
  }

  const normalized = sanitizePendingInviteToken(token);

  if (!normalized) {
    clearPendingInviteCookie();
    return;
  }

  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${PENDING_INVITE_COOKIE_NAME}=${encodeURIComponent(normalized)}; ` +
    `Max-Age=${PENDING_INVITE_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secureFlag}`;
}

export function clearPendingInviteCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie =
    `${PENDING_INVITE_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}
