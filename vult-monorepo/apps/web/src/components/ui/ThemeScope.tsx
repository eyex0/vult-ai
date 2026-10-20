import { createContext, useContext, type ReactNode } from "react";

/** Portaled UI (modals, menus, tooltips) renders outside the app's DOM tree, so it reads the theme from here. */
const ThemeContext = createContext<"light" | "dark">("light");

export function ThemeScope({ theme, children }: { theme: "light" | "dark"; children: ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useThemeClass() {
  return useContext(ThemeContext) === "dark" ? "theme-dark" : "";
}
