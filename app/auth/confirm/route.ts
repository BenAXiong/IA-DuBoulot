import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import {
  PENDING_INVITE_COOKIE_NAME,
  sanitizePendingInviteToken,
} from "@/lib/auth/pending-invite";
import { sanitizeRelativeRedirectPath } from "@/lib/auth/redirect-path";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function buildAuthRedirect(request: NextRequest, messageType: "error", message: string) {
  const url = new URL("/auth", request.url);
  url.searchParams.set(messageType, message);
  return url;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const nextFromQuery = sanitizeRelativeRedirectPath(
    request.nextUrl.searchParams.get("next"),
    "",
  );
  const pendingInviteToken = sanitizePendingInviteToken(
    request.cookies.get(PENDING_INVITE_COOKIE_NAME)?.value,
  );
  const next =
    nextFromQuery ||
    (pendingInviteToken ? `/invite/${pendingInviteToken}` : "/onboarding");

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      buildAuthRedirect(
        request,
        "error",
        "Le lien de confirmation est incomplet ou invalide.",
      ),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(
      buildAuthRedirect(
        request,
        "error",
        "Le lien de confirmation a expire ou ne peut pas etre verifie.",
      ),
    );
  }

  const completeUrl = new URL("/auth/complete", request.url);
  completeUrl.searchParams.set("next", next);

  const response = NextResponse.redirect(completeUrl);
  response.cookies.set(PENDING_INVITE_COOKIE_NAME, "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });
  return response;
}
