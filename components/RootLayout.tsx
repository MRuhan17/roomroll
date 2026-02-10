import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { GlobalBackground } from './GlobalBackground';
import { Button } from './ui/button';
import { Moon, Sun } from 'lucide-react';

export function RootLayout() {
  const [isDarkerVariant, setIsDarkerVariant] = useState(false);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="relative min-h-screen">
      <GlobalBackground isDarker={isDarkerVariant} />
      
      {/* Theme toggle - available on all pages */}
      {!isLoginPage && (
        <div className="fixed top-6 right-6 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDarkerVariant(!isDarkerVariant)}
            className="bg-stone-900/80 border-stone-700 hover:bg-stone-800/80"
            title={isDarkerVariant ? "Switch to Standard" : "Switch to Darker"}
          >
            {isDarkerVariant ? (
              <Sun className="h-5 w-5 text-amber-500" />
            ) : (
              <Moon className="h-5 w-5 text-stone-400" />
            )}
          </Button>
        </div>
      )}

      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
}
