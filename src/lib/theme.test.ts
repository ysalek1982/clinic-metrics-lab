import { describe, expect, it } from "vitest";
import { applyTheme, normalizeThemeMode, resolveTheme, THEME_STORAGE_KEY, readStoredTheme, writeStoredTheme } from "./theme";

describe("theme helpers", () => {
  it("normaliza solo modos soportados", () => {
    expect(normalizeThemeMode("light")).toBe("light");
    expect(normalizeThemeMode("dark")).toBe("dark");
    expect(normalizeThemeMode("system")).toBe("system");
    expect(normalizeThemeMode("contrast")).toBeNull();
  });

  it("resuelve system segun el tema del sistema", () => {
    expect(resolveTheme("system", "light")).toBe("light");
    expect(resolveTheme("system", "dark")).toBe("dark");
    expect(resolveTheme("dark", "light")).toBe("dark");
  });

  it("lee y persiste preferencia sin exponer datos sensibles", () => {
    localStorage.clear();
    writeStoredTheme("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(readStoredTheme()).toBe("light");
  });

  it("aplica clase dark y atributos de estado al documento", () => {
    const root = document.createElement("html");

    expect(applyTheme("dark", root)).toBe("dark");
    expect(root.classList.contains("dark")).toBe(true);
    expect(root.dataset.theme).toBe("dark");
    expect(root.dataset.themeMode).toBe("dark");

    expect(applyTheme("light", root)).toBe("light");
    expect(root.classList.contains("dark")).toBe(false);
    expect(root.dataset.theme).toBe("light");
  });
});
