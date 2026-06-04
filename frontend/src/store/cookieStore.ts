import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookieState {
  hasConsented: boolean;
  preferences: CookiePreferences;
  setConsent: (preferences: CookiePreferences) => void;
  acceptAll: () => void;
  rejectAll: () => void;
}

export const useCookieStore = create<CookieState>()(
  persist(
    (set) => ({
      hasConsented: false,
      preferences: {
        essential: true, // Always true
        functional: false,
        analytics: false,
        marketing: false,
      },
      setConsent: (preferences) =>
        set({
          hasConsented: true,
          preferences: { ...preferences, essential: true },
        }),
      acceptAll: () =>
        set({
          hasConsented: true,
          preferences: {
            essential: true,
            functional: true,
            analytics: true,
            marketing: true,
          },
        }),
      rejectAll: () =>
        set({
          hasConsented: true,
          preferences: {
            essential: true,
            functional: false,
            analytics: false,
            marketing: false,
          },
        }),
    }),
    {
      name: 'roomroll-cookie-consent',
    }
  )
);
