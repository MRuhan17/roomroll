import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="container relative z-10 flex min-h-screen items-center justify-center py-10">
      <section className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-panel hidden rounded-2xl border border-white/10 p-8 shadow-glow lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-4">
            <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
              Roomroll V1
            </p>
            <h1 className="max-w-md text-4xl font-semibold leading-tight text-white">
              Build cinematic sessions with real-time tabletop flow.
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-slate-300">
              A collaborative board for tactical play, dice, and AI-assisted storytelling.
            </p>
          </div>
          <div className="rounded-xl border border-amber-200/20 bg-amber-300/10 p-4">
            <p className="text-xs uppercase tracking-widest text-amber-100/80">Status</p>
            <p className="mt-1 text-sm font-medium text-amber-100">Phase 1: Auth & Frontend</p>
          </div>
        </div>

        <div className="w-full">
          <div className="mb-5 space-y-2 lg:hidden">
            <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
              Roomroll V1
            </p>
            <h1 className="text-3xl font-semibold text-white">{title}</h1>
            <p className="text-sm text-slate-300">{subtitle}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
