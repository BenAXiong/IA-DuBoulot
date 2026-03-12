import {
  CUSTOM_THEME_FIELDS,
  CUSTOM_THEME_STORAGE_KEY,
  DEFAULT_CUSTOM_THEME,
  THEME_COLOR_SCHEMES,
  THEME_MODES,
  THEME_STORAGE_KEY,
  THEME_STORAGE_VERSION,
  THEME_VERSION_STORAGE_KEY,
} from "@/lib/theme/config";

const bootstrapThemeScript = `
  try {
    var validThemes = ${JSON.stringify(THEME_MODES)};
    var themeStorageKey = "${THEME_STORAGE_KEY}";
    var versionStorageKey = "${THEME_VERSION_STORAGE_KEY}";
    var customThemeStorageKey = "${CUSTOM_THEME_STORAGE_KEY}";
    var storageVersion = "${THEME_STORAGE_VERSION}";
    var customThemeFields = ${JSON.stringify(CUSTOM_THEME_FIELDS)};
    var defaultCustomTheme = ${JSON.stringify(DEFAULT_CUSTOM_THEME)};
    var colorSchemes = ${JSON.stringify(THEME_COLOR_SCHEMES)};
    var storedTheme = localStorage.getItem(themeStorageKey);
    var storedVersion = localStorage.getItem(versionStorageKey);

    if (storedVersion !== storageVersion && storedTheme === "dark") {
      storedTheme = "smooth";
      localStorage.setItem(themeStorageKey, storedTheme);
    }

    localStorage.setItem(versionStorageKey, storageVersion);

    var theme = validThemes.indexOf(storedTheme) >= 0
      ? storedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = colorSchemes[theme] || "light";

    customThemeFields.forEach(function(field) {
      document.documentElement.style.removeProperty(field);
    });

    if (theme === "custom") {
      var storedCustomTheme = localStorage.getItem(customThemeStorageKey);
      var parsedCustomTheme = storedCustomTheme ? JSON.parse(storedCustomTheme) : {};
      customThemeFields.forEach(function(field) {
        var value = typeof parsedCustomTheme[field] === "string" && parsedCustomTheme[field].trim()
          ? parsedCustomTheme[field].trim()
          : defaultCustomTheme[field];
        document.documentElement.style.setProperty(field, value);
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
