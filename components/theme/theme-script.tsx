import { THEME_STORAGE_KEY } from "@/lib/theme/config";

const bootstrapThemeScript = `
  try {
    var storedTheme = localStorage.getItem("${THEME_STORAGE_KEY}");
    var theme = storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
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
