import type { ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center justify-center py-10 bg-background overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-50 pointer-events-none"></div>
      <div className="w-full max-w-md z-10 px-4">
        {children}
      </div>
    </main>
  );
}
