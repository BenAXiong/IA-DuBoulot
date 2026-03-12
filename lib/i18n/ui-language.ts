import {
  UI_LANGUAGE_CODES,
  type UiLanguageCode,
} from "@/lib/i18n/config";

export type SearchParamValue = string | string[] | undefined | null;
export type SearchParamsRecord = Record<string, SearchParamValue>;

export function readFirstSearchParam(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function resolveUiLanguageFromSearchParam(
  value: SearchParamValue,
  fallback: UiLanguageCode = "fr",
) {
  const candidate = readFirstSearchParam(value);

  if (candidate && UI_LANGUAGE_CODES.includes(candidate as UiLanguageCode)) {
    return candidate as UiLanguageCode;
  }

  return fallback;
}

export function buildHrefWithSearchParams(
  pathname: string,
  searchParams: SearchParamsRecord,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry) {
          params.append(key, entry);
        }
      }
      continue;
    }

    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}

export function withUiLanguage(href: string, languageCode: UiLanguageCode) {
  if (/^[a-z]+:/i.test(href)) {
    return href;
  }

  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const pathWithQuery = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const [pathname, query = ""] = pathWithQuery.split("?");
  const params = new URLSearchParams(query);

  params.set("lang", languageCode);

  const search = params.toString();
  return `${pathname}${search ? `?${search}` : ""}${hash}`;
}
