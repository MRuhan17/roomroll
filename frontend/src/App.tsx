import { useState, useEffect } from 'react';
import { AuthScreen } from './components/auth/AuthScreen';
import { Dashboard } from './components/dashboard/Dashboard';
import { Lobby } from './components/lobby/Lobby';
import { SessionRoom } from './components/session/SessionRoom';
import { GlobalBackground } from './components/common/GlobalBackground';
import { Navigation } from './components/navigation/Navigation';
import { useAuth } from './context/AuthContext';
import { useGameState } from './context/GameStateContext';
import { validateRouteChange, canNavigateAway, getDefaultRoute, type Route } from './guards/RouteGuards';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Route>('auth');
  const [isDarkerVariant, setIsDarkerVariant] = useState(false);
  const { isAuthenticated } = useAuth();
  const { userState } = useGameState();

  // Guard: Sync route with user state on state changes
  // This ensures the route is always valid for the current state
  useEffect(() => {
    const defaultRoute = getDefaultRoute(userState);

    // If current page is not valid for the state, redirect to default
    const validatedRoute = validateRouteChange(userState, currentPage);
    if (validatedRoute !== currentPage) {
      setCurrentPage(validatedRoute);
    }
  }, [userState, currentPage]);

  // Guard: Handle route change requests with validation
  // This prevents users from navigating to unauthorized routes
  const handlePageChange = (requestedRoute: Route) => {
    // Guard Rule: Check if user can navigate away from current route
    // Success Criteria: Users cannot navigate away during active session
    if (!canNavigateAway(userState, currentPage, requestedRoute)) {
      console.warn(`Navigation blocked: Cannot leave ${currentPage} while in state ${userState.state}`);
      return;
    }

    // Guard Rule: Validate the requested route against user state
    // Success Criteria: Users cannot access Session Room early
    const validatedRoute = validateRouteChange(userState, requestedRoute);

    if (validatedRoute !== requestedRoute) {
      console.warn(
        `Route guard: Redirecting from ${requestedRoute} to ${validatedRoute} (user state: ${userState.state})`
      );
    }

    setCurrentPage(validatedRoute);
  };

  return (
    <div className="relative min-h-screen">
      <GlobalBackground isDarker={isDarkerVariant} />

      <Navigation
        currentPage={currentPage}
        onPageChange={handlePageChange}
        isDarkerVariant={isDarkerVariant}
        onVariantToggle={() => setIsDarkerVariant(!isDarkerVariant)}
      />

      <div className="relative z-10">
        {currentPage === 'auth' && <AuthScreen />}
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'lobby' && <Lobby />}
        {currentPage === 'session' && <SessionRoom />}
      </div>
    </div>
  );
}
