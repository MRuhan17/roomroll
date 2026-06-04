import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccessibilityStore } from "@/store/accessibilityStore";
import { X, Settings, Download, Trash2, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { api, getApiErrorMessage } from "@/services/api";

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"accessibility" | "account">("accessibility");
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-[#d5b45d]/20 bg-[#111115] shadow-2xl flex flex-col md:flex-row h-[80vh] md:h-auto max-h-[600px]">
        
        {/* Sidebar */}
        <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-white/10 bg-black/40 p-4 shrink-0 flex md:flex-col gap-2 overflow-x-auto">
          <div className="hidden md:flex items-center gap-2 mb-4 text-[#d5b45d] px-2">
            <Settings className="w-5 h-5" />
            <span className="font-display tracking-widest uppercase text-sm">Settings</span>
          </div>
          <button
            onClick={() => setActiveTab("accessibility")}
            className={`text-left px-4 py-2.5 rounded-lg text-sm font-semibold tracking-wider uppercase transition-colors ${
              activeTab === "accessibility" ? "bg-[#d5b45d]/20 text-[#d5b45d]" : "text-[#a39a88] hover:text-[#e6decb] hover:bg-white/5"
            }`}
          >
            Accessibility
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`text-left px-4 py-2.5 rounded-lg text-sm font-semibold tracking-wider uppercase transition-colors ${
              activeTab === "account" ? "bg-[#d5b45d]/20 text-[#d5b45d]" : "text-[#a39a88] hover:text-[#e6decb] hover:bg-white/5"
            }`}
          >
            Account
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 text-[#a39a88] hover:text-[#f5efe2] transition-colors">
            <X className="w-5 h-5" />
          </button>
          
          {activeTab === "accessibility" && <AccessibilitySettings />}
          {activeTab === "account" && <AccountSettings onDeleted={onClose} />}
        </div>
      </div>
    </div>
  );
}

function AccessibilitySettings() {
  const { reducedMotion, highContrast, largeText, setReducedMotion, setHighContrast, setLargeText } = useAccessibilityStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="text-xl font-display uppercase tracking-widest text-[#f5efe2]">Accessibility</h3>
        <p className="text-sm text-[#cbc3b5]/70 mt-2 leading-relaxed">Customize RoomRoll to suit your visual and interactive needs.</p>
      </div>

      <div className="space-y-4">
        <label className="flex items-start gap-4 p-4 rounded-lg border border-[#8f733f]/20 bg-black/20 hover:bg-black/40 cursor-pointer transition-colors">
          <input 
            type="checkbox" 
            checked={reducedMotion} 
            onChange={e => setReducedMotion(e.target.checked)}
            className="mt-1 accent-[#d5b45d] w-4 h-4" 
          />
          <div>
            <div className="font-bold text-sm uppercase tracking-wider text-[#e6decb]">Reduced Motion</div>
            <div className="text-xs text-[#a39a88] mt-1">Disables cinematic background animations, parallax effects, and limits UI transitions.</div>
          </div>
        </label>

        <label className="flex items-start gap-4 p-4 rounded-lg border border-[#8f733f]/20 bg-black/20 hover:bg-black/40 cursor-pointer transition-colors">
          <input 
            type="checkbox" 
            checked={highContrast} 
            onChange={e => setHighContrast(e.target.checked)}
            className="mt-1 accent-[#d5b45d] w-4 h-4" 
          />
          <div>
            <div className="font-bold text-sm uppercase tracking-wider text-[#e6decb]">High Contrast</div>
            <div className="text-xs text-[#a39a88] mt-1">Increases color contrast across the platform to improve legibility.</div>
          </div>
        </label>

        <label className="flex items-start gap-4 p-4 rounded-lg border border-[#8f733f]/20 bg-black/20 hover:bg-black/40 cursor-pointer transition-colors">
          <input 
            type="checkbox" 
            checked={largeText} 
            onChange={e => setLargeText(e.target.checked)}
            className="mt-1 accent-[#d5b45d] w-4 h-4" 
          />
          <div>
            <div className="font-bold text-sm uppercase tracking-wider text-[#e6decb]">Large Text</div>
            <div className="text-xs text-[#a39a88] mt-1">Scales up typography for easier reading without relying entirely on browser zoom.</div>
          </div>
        </label>
      </div>
    </div>
  );
}

function AccountSettings({ onDeleted }: { onDeleted: () => void }) {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const clearAuth = useAuthStore(state => state.clearAuth);

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await api.get('/api/auth/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roomroll-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Password required");
      return;
    }
    const confirmed = window.confirm("Are you absolutely sure? This will delete all your campaigns, characters, and data permanently.");
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");
      await api.delete('/api/auth/account', { data: { password } });
      clearAuth();
      onDeleted();
      window.location.href = '/';
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete account. Check password."));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="text-xl font-display uppercase tracking-widest text-[#f5efe2]">Account & Data</h3>
        <p className="text-sm text-[#cbc3b5]/70 mt-2 leading-relaxed">Manage your personal data and account status.</p>
      </div>

      <div className="space-y-6">
        <div className="p-5 rounded-lg border border-white/10 bg-black/20">
          <div className="flex items-start gap-4">
            <div className="mt-1 text-[#d5b45d]"><Download className="w-5 h-5" /></div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-[#e6decb]">Export Your Data</h4>
              <p className="text-xs text-[#a39a88] mt-1 leading-relaxed max-w-sm mb-4">
                Download a JSON archive of your profile, characters, campaigns, rooms, and lore.
              </p>
              <Button 
                variant="outline" 
                onClick={handleExport} 
                disabled={exporting}
                className="bg-transparent border-[#8f733f]/60 text-[#c7b98f] hover:bg-[#8f733f]/20 uppercase tracking-widest text-xs h-8"
              >
                {exporting ? "Compiling Archive..." : "Export JSON"}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-lg border border-red-900/30 bg-red-950/10">
          <div className="flex items-start gap-4">
            <div className="mt-1 text-red-500"><AlertTriangle className="w-5 h-5" /></div>
            <div className="w-full">
              <h4 className="font-bold text-sm uppercase tracking-wider text-red-200">Danger Zone: Delete Account</h4>
              <p className="text-xs text-red-300/70 mt-1 leading-relaxed max-w-sm mb-4">
                Permanently remove your account and all associated data. This action cannot be undone.
              </p>
              
              <form onSubmit={handleDelete} className="flex gap-2 w-full max-w-xs">
                <input 
                  type="password" 
                  placeholder="Verify Password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-black/40 border border-red-900/40 rounded px-3 py-1.5 text-sm text-white w-full placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                  required
                />
                <Button 
                  type="submit"
                  disabled={deleting}
                  className="bg-red-900/40 border border-red-900 text-red-200 hover:bg-red-800 uppercase tracking-widest text-xs shrink-0"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </form>
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
