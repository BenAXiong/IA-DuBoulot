import type { NextRequest } from "next/server";
import { UI_LANGUAGE_CODES, type UiLanguageCode } from "@/lib/i18n/config";
import { APP_UI_LANGUAGE_COOKIE_NAME } from "@/lib/i18n/ui-language";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const requestedLanguage = request.nextUrl.searchParams.get("lang");
  const languageCode = UI_LANGUAGE_CODES.includes(
    requestedLanguage as UiLanguageCode,
  )
    ? (requestedLanguage as UiLanguageCode)
    : null;

  if (languageCode) {
    request.cookies.set(APP_UI_LANGUAGE_COOKIE_NAME, languageCode);
  }

  const response = await updateSession(request);

  if (languageCode) {
    response.cookies.set(APP_UI_LANGUAGE_COOKIE_NAME, languageCode, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
