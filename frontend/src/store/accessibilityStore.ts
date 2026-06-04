import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AccessibilityState {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  setReducedMotion: (value: boolean) => void;
  setHighContrast: (value: boolean) => void;
  setLargeText: (value: boolean) => void;
}

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set) => ({
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      setReducedMotion: (value) => {
        set({ reducedMotion: value });
        if (value) {
          document.documentElement.classList.add('reduced-motion');
        } else {
          document.documentElement.classList.remove('reduced-motion');
        }
      },
      setHighContrast: (value) => {
        set({ highContrast: value });
        if (value) {
          document.documentElement.classList.add('high-contrast');
        } else {
          document.documentElement.classList.remove('high-contrast');
        }
      },
      setLargeText: (value) => {
        set({ largeText: value });
        if (value) {
          document.documentElement.classList.add('large-text');
        } else {
          document.documentElement.classList.remove('large-text');
        }
      },
    }),
    {
      name: 'roomroll-accessibility',
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.reducedMotion) document.documentElement.classList.add('reduced-motion');
          if (state.highContrast) document.documentElement.classList.add('high-contrast');
          if (state.largeText) document.documentElement.classList.add('large-text');
        }
      }
    }
  )
);
