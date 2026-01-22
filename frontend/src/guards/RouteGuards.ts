/**
 * Route Guards Based on Game State
 * 
 * This module implements navigation rules that enforce the game state model.
 * Users can only access routes that are valid for their current state.
 * 
 * Guard Rules:
 * - UNAUTHENTICATED: Can only access 'auth'
 * - AUTHENTICATED: Can access 'dashboard', cannot access 'lobby' or 'session'
 * - IN_LOBBY: Can access 'dashboard' and 'lobby', cannot access 'session'
 * - IN_SESSION: Can access 'lobby' and 'session', cannot leave session
 */

import { UserState, type UserStateContext } from '../models/GameState';

export type Route = 'auth' | 'dashboard' | 'lobby' | 'session';

/**
 * Determines if a user can access a specific route based on their current state.
 * 
 * @param userState - Current user state context
 * @param route - Route the user is attempting to access
 * @returns true if access is allowed, false otherwise
 */
export function canAccessRoute(userState: UserStateContext, route: Route): boolean {
    // Rule: UNAUTHENTICATED users can only access auth page
    if (userState.state === UserState.UNAUTHENTICATED) {
        return route === 'auth';
    }

    // Rule: Authenticated users cannot access auth page (already logged in)
    // At this point, TypeScript knows state is AUTHENTICATED | IN_LOBBY | IN_SESSION
    if (route === 'auth') {
        return false; // Only UNAUTHENTICATED can access auth
    }

    // Rule: AUTHENTICATED users can only access dashboard
    // They must join a lobby before accessing lobby or session pages
    if (userState.state === UserState.AUTHENTICATED) {
        return route === 'dashboard';
    }

    // Rule: IN_LOBBY users can access dashboard and lobby
    // They cannot access session until DM starts it
    if (userState.state === UserState.IN_LOBBY) {
        return route === 'dashboard' || route === 'lobby';
    }

    // Rule: IN_SESSION users can access lobby and session
    // They can view lobby (to see members) but primary view is session
    if (userState.state === UserState.IN_SESSION) {
        return route === 'lobby' || route === 'session';
    }

    // Default: deny access
    return false;
}

/**
 * Determines the appropriate redirect route when access is denied.
 * 
 * @param userState - Current user state context
 * @param attemptedRoute - Route the user tried to access
 * @returns Route to redirect to
 */
export function getRedirectRoute(userState: UserStateContext, attemptedRoute: Route): Route {
    // Rule: If unauthenticated, always redirect to auth
    if (userState.state === UserState.UNAUTHENTICATED) {
        return 'auth';
    }

    // Rule: If authenticated but not in lobby, redirect to dashboard
    if (userState.state === UserState.AUTHENTICATED) {
        return 'dashboard';
    }

    // Rule: If in lobby but trying to access session early, stay in lobby
    if (userState.state === UserState.IN_LOBBY && attemptedRoute === 'session') {
        return 'lobby';
    }

    // Rule: If in session but trying to leave, stay in session
    // This prevents accidental navigation away during active session
    if (userState.state === UserState.IN_SESSION && attemptedRoute !== 'session' && attemptedRoute !== 'lobby') {
        return 'session';
    }

    // Rule: If in session and trying to access dashboard, redirect to session
    // Users cannot leave an active session to browse dashboard
    if (userState.state === UserState.IN_SESSION && attemptedRoute === 'dashboard') {
        return 'session';
    }

    // Default: redirect to dashboard (safe fallback)
    return 'dashboard';
}

/**
 * Validates a route change and returns the allowed route.
 * If the requested route is not allowed, returns the appropriate redirect.
 * 
 * @param userState - Current user state context
 * @param requestedRoute - Route the user wants to navigate to
 * @returns The route the user should actually navigate to
 */
export function validateRouteChange(
    userState: UserStateContext,
    requestedRoute: Route
): Route {
    // Check if user can access the requested route
    if (canAccessRoute(userState, requestedRoute)) {
        return requestedRoute;
    }

    // Access denied - determine redirect
    return getRedirectRoute(userState, requestedRoute);
}

/**
 * Checks if a user can navigate away from their current route.
 * This is used to prevent navigation during critical states (e.g., active session).
 * 
 * @param userState - Current user state context
 * @param currentRoute - Route the user is currently on
 * @param targetRoute - Route the user wants to navigate to
 * @returns true if navigation is allowed, false if blocked
 */
export function canNavigateAway(
    userState: UserStateContext,
    currentRoute: Route,
    targetRoute: Route
): boolean {
    // Rule: Users in an active session cannot navigate to dashboard
    // They must stay in session or lobby context
    if (userState.state === UserState.IN_SESSION && currentRoute === 'session') {
        // Can navigate to lobby (to see members) but not dashboard
        return targetRoute === 'lobby' || targetRoute === 'session';
    }

    // Rule: Users in lobby can navigate freely (session hasn't started)
    if (userState.state === UserState.IN_LOBBY) {
        return true;
    }

    // Rule: Authenticated users can navigate freely
    if (userState.state === UserState.AUTHENTICATED) {
        return true;
    }

    // Rule: Unauthenticated users can only navigate to auth
    if (userState.state === UserState.UNAUTHENTICATED) {
        return targetRoute === 'auth';
    }

    // Default: allow navigation
    return true;
}

/**
 * Gets the default route for a given user state.
 * This is used when the app first loads or after state changes.
 * 
 * @param userState - Current user state context
 * @returns The default route for this state
 */
export function getDefaultRoute(userState: UserStateContext): Route {
    switch (userState.state) {
        case UserState.UNAUTHENTICATED:
            return 'auth';

        case UserState.AUTHENTICATED:
            return 'dashboard';

        case UserState.IN_LOBBY:
            return 'lobby';

        case UserState.IN_SESSION:
            return 'session';

        default:
            // Fallback to auth for safety
            return 'auth';
    }
}
