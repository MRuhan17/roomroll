import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { DoorOpen, LogOut, Shield, Users, Flame, BookOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { AmbientBackdrop, Embers, BrandMark } from "@/components/landing/LandingPrimitives";
import { useQueryClient } from "@tanstack/react-query";
import { SettingsModal } from "@/components/SettingsModal";
import { useState } from "react";

export function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const queryClient = useQueryClient();

  const onLogout = () => {
    queryClient.clear();
    clearAuth();
    navigate("/login");
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden font-sans">
      <AmbientBackdrop />
      <Embers className="opacity-40" />
      
      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="tavern-card border-b border-tavern-border p-6 lg:border-b-0 lg:border-r relative overflow-hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl z-[-1]" />
          
          <Link to="/campaigns" className="block hover:opacity-90 transition-opacity">
            <BrandMark />
          </Link>

          <nav className="mt-12 space-y-3">
            <NavLink
              to="/campaigns"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded px-4 py-3 text-sm uppercase tracking-widest transition-all duration-300 border ${
                  isActive 
                  ? "bg-[#ab211f]/20 text-[#f5efe2] border-[#ab211f]/50 shadow-[0_0_15px_rgba(171,33,31,0.2)]" 
                  : "text-[#cbc3b5]/70 border-transparent hover:bg-white/5 hover:text-[#f5efe2]"
                }`
              }
            >
              <BookOpen className="h-4 w-4" />
              Campaigns
            </NavLink>
            <NavLink
              to="/rooms"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded px-4 py-3 text-sm uppercase tracking-widest transition-all duration-300 border ${
                  isActive 
                  ? "bg-[#ab211f]/20 text-[#f5efe2] border-[#ab211f]/50 shadow-[0_0_15px_rgba(171,33,31,0.2)]" 
                  : "text-[#cbc3b5]/70 border-transparent hover:bg-white/5 hover:text-[#f5efe2]"
                }`
              }
            >
              <Users className="h-4 w-4" />
              Tavern Lobby
            </NavLink>
          </nav>

          <div className="mt-12 rounded border border-[#d5b45d]/20 bg-black/50 p-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#d5b45d]">Current Quests</p>
            <p className="mt-2 text-sm text-[#cbc3b5]/60 leading-relaxed font-serif italic">Your active adventures will be chronicled here.</p>
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.2em]">
            <Link to="/privacy" className="text-[#cbc3b5]/50 hover:text-[#d5b45d] transition-colors">Privacy</Link>
            <Link to="/terms" className="text-[#cbc3b5]/50 hover:text-[#d5b45d] transition-colors">Terms</Link>
            <Link to="/accessibility" className="text-[#cbc3b5]/50 hover:text-[#d5b45d] transition-colors">Accessibility</Link>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col relative z-10">
          <header className="tavern-card flex items-center justify-between border-b border-tavern-border px-8 py-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#d5b45d]/70">Adventurer</p>
              <p className="text-base font-display text-[#f5efe2] tracking-wider">{user?.displayName ?? user?.email ?? "Traveler"}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => setIsSettingsOpen(true)} className="gap-2 text-[#cbc3b5]/70 hover:bg-white/5 hover:text-[#f5efe2] font-display uppercase tracking-widest text-xs h-9">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button variant="outline" onClick={onLogout} className="gap-2 border-[#d5b45d]/30 text-[#d5b45d] hover:bg-[#d5b45d]/10 hover:text-[#f5efe2] font-display uppercase tracking-widest text-xs h-9">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Depart</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 px-8 py-8 overflow-y-auto tavern-bg">
            <Outlet />
          </main>
        </div>
      </div>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
