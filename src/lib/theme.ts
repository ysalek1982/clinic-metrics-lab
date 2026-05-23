export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "nutri.theme";
export const DEFAULT_THEME_MODE: ThemeMode = "dark";

export function normalizeThemeMode(value: string | null | undefined): ThemeMode | null {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return null;
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(mode: ThemeMode, systemTheme: ResolvedTheme = getSystemTheme()): ResolvedTheme {
  return mode === "system" ? systemTheme : mode;
}

export function readStoredTheme(storage: Storage | undefined = getBrowserStorage()): ThemeMode {
  try {
    return normalizeThemeMode(storage?.getItem(THEME_STORAGE_KEY)) ?? DEFAULT_THEME_MODE;
  } catch {
    return DEFAULT_THEME_MODE;
  }
}

export function writeStoredTheme(mode: ThemeMode, storage: Storage | undefined = getBrowserStorage()) {
  try {
    storage?.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Storage can be unavailable in private or embedded contexts.
  }
}

export function applyTheme(mode: ThemeMode, root: HTMLElement | undefined = getDocumentRoot()): ResolvedTheme {
  const resolvedTheme = resolveTheme(mode);

  if (!root) {
    return resolvedTheme;
  }

  root.classList.toggle("dark", resolvedTheme === "dark");
  root.dataset.theme = resolvedTheme;
  root.dataset.themeMode = mode;
  root.style.colorScheme = resolvedTheme;

  return resolvedTheme;
}

function getBrowserStorage(): Storage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage;
}

function getDocumentRoot(): HTMLElement | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  return document.documentElement;
}
