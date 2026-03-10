import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function buildAuthRedirect(request: NextRequest, messageType: "error", message: string) {
  const url = new URL("/auth", request.url);
  url.searchParams.set(messageType, message);
  return url;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const next = request.nextUrl.searchParams.get("next") ?? "/onboarding";

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

  return NextResponse.redirect(new URL(next, request.url));
}
