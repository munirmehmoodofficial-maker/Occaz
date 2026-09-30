import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";
const KEY = "occaz.theme";

const getInitial = (): Theme => {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = localStorage.getItem(KEY) as Theme | null;
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitial);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch {}
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((p) => (p === "dark" ? "light" : "dark"));
  }, []);

  return { theme, setTheme, toggle };
}
