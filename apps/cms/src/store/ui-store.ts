import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = "dark" | "light" | "system";

interface UIState {
  theme: Theme;
  mobileSidebarOpen: boolean;
  desktopSidebarExpanded: boolean;
  setTheme: (theme: Theme) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setDesktopSidebarExpanded: (expanded: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "system",
      mobileSidebarOpen: false,
      desktopSidebarExpanded: true,
      
      setTheme: (theme) => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        if (theme === "system") {
          const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
          root.classList.add(systemTheme);
        } else {
          root.classList.add(theme);
        }
        set({ theme });
      },
      
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      
      setDesktopSidebarExpanded: (expanded) => set({ desktopSidebarExpanded: expanded }),
    }),
    {
      name: 'onecms-ui-storage',
      partialize: (state) => ({ 
        theme: state.theme, 
        desktopSidebarExpanded: state.desktopSidebarExpanded 
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const root = window.document.documentElement;
          root.classList.remove("light", "dark");
          if (state.theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.add(systemTheme);
          } else {
            root.classList.add(state.theme);
          }
        }
      }
    }
  )
);
