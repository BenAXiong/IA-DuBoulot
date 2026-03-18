import {
  CUSTOM_THEME_FIELDS,
  CUSTOM_THEME_STORAGE_KEY,
  THEME_COLOR_SCHEMES,
  THEME_STORAGE_KEY,
  THEME_STORAGE_VERSION,
  THEME_VERSION_STORAGE_KEY,
} from "@/lib/theme/config";

const bootstrapThemeScript = `
  try {
    var themeStorageKey = "${THEME_STORAGE_KEY}";
    var versionStorageKey = "${THEME_VERSION_STORAGE_KEY}";
    var customThemeStorageKey = "${CUSTOM_THEME_STORAGE_KEY}";
    var storageVersion = "${THEME_STORAGE_VERSION}";
    var customThemeFields = ${JSON.stringify(CUSTOM_THEME_FIELDS)};
    var colorSchemes = ${JSON.stringify(THEME_COLOR_SCHEMES)};
    var root = document.documentElement;
    var mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    var validThemes = ["light", "dark"];

    function clearStoredThemePreference(clearTheme) {
      if (clearTheme !== false) {
        localStorage.removeItem(themeStorageKey);
      }
      localStorage.removeItem(versionStorageKey);
      localStorage.removeItem(customThemeStorageKey);
    }

    function readStoredTheme() {
      var storedTheme = localStorage.getItem(themeStorageKey);
      return validThemes.indexOf(storedTheme) >= 0 ? storedTheme : null;
    }

    function applyTheme(theme) {
      root.dataset.theme = theme;
      root.style.colorScheme = colorSchemes[theme] || "light";
      customThemeFields.forEach(function(field) {
        root.style.removeProperty(field);
      });
    }

    function applyPreferredTheme() {
      var storedTheme = readStoredTheme();
      applyTheme(storedTheme || (mediaQuery.matches ? "dark" : "light"));
    }

    if (!readStoredTheme()) {
      clearStoredThemePreference();
    } else {
      localStorage.setItem(versionStorageKey, storageVersion);
      localStorage.removeItem(customThemeStorageKey);
    }

    applyPreferredTheme();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", function() {
        if (!readStoredTheme()) {
          applyPreferredTheme();
        }
      });
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(function() {
        if (!readStoredTheme()) {
          applyPreferredTheme();
        }
      });
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
