import { useState } from "react";
import { useCookieStore, CookiePreferences } from "@/store/cookieStore";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CookieConsentBanner() {
  const { hasConsented, preferences, acceptAll, rejectAll, setConsent } = useCookieStore();
  const [showCustomize, setShowCustomize] = useState(false);
  const [localPrefs, setLocalPrefs] = useState<CookiePreferences>(preferences);

  if (hasConsented && !showCustomize) return null;

  const handleSavePreferences = () => {
    setConsent(localPrefs);
    setShowCustomize(false);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 p-4 md:p-6 pointer-events-none">
      <div className="mx-auto max-w-4xl bg-[#111115]/95 backdrop-blur-xl border border-[#d5b45d]/20 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-6 pointer-events-auto text-[#f5efe2]">
        
        {!showCustomize ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="font-display uppercase tracking-widest text-lg text-[#d5b45d]">We Value Your Privacy</h3>
              <p className="text-sm text-[#cbc3b5]/80 max-w-2xl leading-relaxed">
                We use cookies to enhance your tabletop experience. They help us remember your session, analyze our traffic, and provide functional improvements. 
                Read our <Link to="/privacy" className="text-[#d5b45d] hover:underline focus-visible:ring-1 focus-visible:ring-[#d5b45d] outline-none">Privacy Policy</Link> for more details.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button 
                variant="outline" 
                onClick={() => setShowCustomize(true)}
                className="bg-transparent border-[#8f733f]/60 text-[#c7b98f] hover:bg-[#8f733f]/20 uppercase tracking-widest text-xs h-9"
              >
                Customize
              </Button>
              <Button 
                variant="outline" 
                onClick={rejectAll}
                className="bg-transparent border-[#8f733f]/60 text-[#c7b98f] hover:bg-[#8f733f]/20 uppercase tracking-widest text-xs h-9"
              >
                Reject Non-Essential
              </Button>
              <Button 
                onClick={acceptAll}
                className="bg-primary/20 text-[#d5b45d] border border-[#d5b45d]/50 hover:bg-[#d5b45d]/30 uppercase tracking-widest text-xs h-9"
              >
                Accept All
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-display uppercase tracking-widest text-lg text-[#d5b45d]">Customize Cookies</h3>
              <p className="text-sm text-[#cbc3b5]/80">Manage your tracking preferences below.</p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-4 p-3 rounded-lg border border-[#8f733f]/20 bg-black/20">
                <input type="checkbox" checked disabled className="mt-1 accent-[#d5b45d]" aria-label="Essential Cookies" />
                <div>
                  <div className="font-bold text-sm uppercase tracking-wider text-[#e6decb]">Essential (Required)</div>
                  <div className="text-xs text-[#a39a88] mt-1">Required for authentication, security, and remembering these preferences.</div>
                </div>
              </label>

              <label className="flex items-start gap-4 p-3 rounded-lg border border-[#8f733f]/20 bg-black/20 hover:bg-black/40 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={localPrefs.functional} 
                  onChange={e => setLocalPrefs(prev => ({ ...prev, functional: e.target.checked }))}
                  className="mt-1 accent-[#d5b45d] focus-visible:ring-2 focus-visible:ring-[#d5b45d] outline-none" 
                  aria-label="Functional Cookies"
                />
                <div>
                  <div className="font-bold text-sm uppercase tracking-wider text-[#e6decb]">Functional</div>
                  <div className="text-xs text-[#a39a88] mt-1">Allows the platform to remember choices you make (like layout preferences) and provide enhanced features.</div>
                </div>
              </label>

              <label className="flex items-start gap-4 p-3 rounded-lg border border-[#8f733f]/20 bg-black/20 hover:bg-black/40 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={localPrefs.analytics} 
                  onChange={e => setLocalPrefs(prev => ({ ...prev, analytics: e.target.checked }))}
                  className="mt-1 accent-[#d5b45d] focus-visible:ring-2 focus-visible:ring-[#d5b45d] outline-none" 
                  aria-label="Analytics Cookies"
                />
                <div>
                  <div className="font-bold text-sm uppercase tracking-wider text-[#e6decb]">Analytics</div>
                  <div className="text-xs text-[#a39a88] mt-1">Helps us understand how visitors interact with the platform by collecting and reporting information anonymously.</div>
                </div>
              </label>

              <label className="flex items-start gap-4 p-3 rounded-lg border border-[#8f733f]/20 bg-black/20 hover:bg-black/40 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={localPrefs.marketing} 
                  onChange={e => setLocalPrefs(prev => ({ ...prev, marketing: e.target.checked }))}
                  className="mt-1 accent-[#d5b45d] focus-visible:ring-2 focus-visible:ring-[#d5b45d] outline-none" 
                  aria-label="Marketing Cookies"
                />
                <div>
                  <div className="font-bold text-sm uppercase tracking-wider text-[#e6decb]">Marketing</div>
                  <div className="text-xs text-[#a39a88] mt-1">Used to track visitors across websites to display relevant advertisements.</div>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setLocalPrefs(preferences);
                  setShowCustomize(false);
                }}
                className="bg-transparent border-[#8f733f]/60 text-[#c7b98f] hover:bg-[#8f733f]/20 uppercase tracking-widest text-xs h-9"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSavePreferences}
                className="bg-primary/20 text-[#d5b45d] border border-[#d5b45d]/50 hover:bg-[#d5b45d]/30 uppercase tracking-widest text-xs h-9"
              >
                Save Preferences
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
