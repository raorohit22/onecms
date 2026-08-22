import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore } from './ui-store';

describe('UI Store', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    // Reset state
    useUIStore.setState({
      theme: 'system',
      mobileSidebarOpen: false,
      desktopSidebarExpanded: true,
    });
    
    document.documentElement.classList.remove('light', 'dark');
    window.localStorage.clear();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('initializes with default state', () => {
    const state = useUIStore.getState();
    expect(state.theme).toBe('system');
    expect(state.mobileSidebarOpen).toBe(false);
    expect(state.desktopSidebarExpanded).toBe(true);
  });

  it('updates desktop sidebar expanded state', () => {
    const { setDesktopSidebarExpanded } = useUIStore.getState();
    setDesktopSidebarExpanded(false);
    expect(useUIStore.getState().desktopSidebarExpanded).toBe(false);
  });

  it('updates mobile sidebar state', () => {
    const { setMobileSidebarOpen } = useUIStore.getState();
    setMobileSidebarOpen(true);
    expect(useUIStore.getState().mobileSidebarOpen).toBe(true);
  });

  it('updates theme to dark and applies class to root', () => {
    const { setTheme } = useUIStore.getState();
    setTheme('dark');
    expect(useUIStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('updates theme to light and applies class to root', () => {
    const { setTheme } = useUIStore.getState();
    setTheme('light');
    expect(useUIStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('falls back to system preferences if theme is system', () => {
    // Mock system preference as dark
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { setTheme } = useUIStore.getState();
    setTheme('system');
    expect(useUIStore.getState().theme).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
