import { useCallback, useEffect, useState } from "react";
import {
  applyTheme,
  getSystemTheme,
  readStoredTheme,
  resolveTheme,
  type ResolvedTheme,
  type ThemeMode,
  writeStoredTheme,
} from "@/lib/theme";

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(readStoredTheme()));

  useEffect(() => {
    const nextResolved = applyTheme(mode);
    setResolvedTheme(nextResolved);

    if (mode !== "system" || typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      setResolvedTheme(applyTheme("system"));
    };

    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, [mode]);

  const setTheme = useCallback((nextMode: ThemeMode) => {
    writeStoredTheme(nextMode);
    setModeState(nextMode);
  }, []);

  return {
    mode,
    resolvedTheme,
    systemTheme: getSystemTheme(),
    setTheme,
  };
}
