import {
  CUSTOM_THEME_FIELDS,
  CUSTOM_THEME_STORAGE_KEY,
  THEME_COLOR_SCHEMES,
  THEME_STORAGE_KEY,
  THEME_VERSION_STORAGE_KEY,
} from "@/lib/theme/config";

const bootstrapThemeScript = `
  try {
    var themeStorageKey = "${THEME_STORAGE_KEY}";
    var versionStorageKey = "${THEME_VERSION_STORAGE_KEY}";
    var customThemeStorageKey = "${CUSTOM_THEME_STORAGE_KEY}";
    var customThemeFields = ${JSON.stringify(CUSTOM_THEME_FIELDS)};
    var colorSchemes = ${JSON.stringify(THEME_COLOR_SCHEMES)};
    var root = document.documentElement;
    var mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function clearStoredThemePreference() {
      localStorage.removeItem(themeStorageKey);
      localStorage.removeItem(versionStorageKey);
      localStorage.removeItem(customThemeStorageKey);
    }

    function applySystemTheme() {
      var theme = mediaQuery.matches ? "dark" : "light";
      root.dataset.theme = theme;
      root.style.colorScheme = colorSchemes[theme] || "light";
      customThemeFields.forEach(function(field) {
        root.style.removeProperty(field);
      });
    }

    clearStoredThemePreference();
    applySystemTheme();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", applySystemTheme);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(applySystemTheme);
    }
  } catch (error) {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
  }
`;

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: bootstrapThemeScript }}
      id="iadb-theme-bootstrap"
      suppressHydrationWarning
    />
  );
}
