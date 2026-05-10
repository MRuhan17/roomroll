import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { DoorOpen, LogOut, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

export function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const onLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-roomroll-grid bg-[size:72px_72px] opacity-20" />
      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="glass-panel border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
          <Link to="/rooms" className="inline-flex items-center gap-2 text-lg font-semibold">
            <Shield className="h-5 w-5 text-cyan-300" />
            Roomroll
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">Realtime tabletop rooms</p>

          <nav className="mt-8 space-y-2">
            <NavLink
              to="/campaigns"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                  isActive ? "bg-cyan-400/15 text-cyan-100" : "text-slate-300 hover:bg-white/5"
                }`
              }
            >
              <Shield className="h-4 w-4" />
              Campaigns
            </NavLink>
            <NavLink
              to="/rooms"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                  isActive ? "bg-cyan-400/15 text-cyan-100" : "text-slate-300 hover:bg-white/5"
                }`
              }
            >
              <Users className="h-4 w-4" />
              Room Lobby
            </NavLink>
          </nav>

          <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-wider text-slate-400">Room list</p>
            <p className="mt-2 text-sm text-slate-300">Rooms will populate here as API wiring is finalized.</p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="glass-panel flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Signed in as</p>
              <p className="text-sm font-medium">{user?.displayName ?? user?.email ?? "Unknown user"}</p>
            </div>
            <Button variant="secondary" onClick={onLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </header>

          <main className="flex-1 px-5 py-6">
            <Outlet />
          </main>
        </div>
      </div>
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-500/30 blur-[110px]" />
      <div className="pointer-events-none absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-amber-500/20 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-6 right-6 text-xs text-slate-500">
        <DoorOpen className="mr-1 inline h-3.5 w-3.5" />
        Phase 2 Lobby
      </div>
    </div>
  );
}
