import React from "react";
import { useUIStore } from "../store/ui-store";

type Theme = "dark" | "light" | "system";

export function ThemeProvider({ children }: { children: React.ReactNode; defaultTheme?: Theme; storageKey?: string }) {
  // ThemeProvider is now just a pass-through since Zustand manages state and hydration
  return <>{children}</>;
}

export const useTheme = () => {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  
  return {
    theme,
    setTheme
  };
};
