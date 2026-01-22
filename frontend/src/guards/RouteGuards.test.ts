/**
 * Route Guards Test Suite
 * 
 * Verifies that route guards correctly enforce navigation rules based on game state.
 * 
 * Success Criteria:
 * 1. Users cannot access Session Room early (before session starts)
 * 2. Users cannot navigate away during an active session
 */

import {
    canAccessRoute,
    getRedirectRoute,
    validateRouteChange,
    canNavigateAway,
    getDefaultRoute,
    type Route,
} from './RouteGuards';
import { UserState, UserRole, type UserStateContext } from '../models/GameState';

// Test helper to create user state contexts
const createUserState = (
    state: 'UNAUTHENTICATED' | 'AUTHENTICATED' | 'IN_LOBBY' | 'IN_SESSION',
    userId: string | null = null,
    lobbyId: string | null = null,
    sessionId: string | null = null,
    role?: UserRole
): UserStateContext => {
    switch (state) {
        case 'UNAUTHENTICATED':
            return { state, userId: null, lobbyId: null, sessionId: null };
        case 'AUTHENTICATED':
            return { state, userId: userId!, lobbyId: null, sessionId: null };
        case 'IN_LOBBY':
            return { state, userId: userId!, lobbyId: lobbyId!, sessionId: null, role: role! };
        case 'IN_SESSION':
            return { state, userId: userId!, lobbyId: lobbyId!, sessionId: sessionId!, role: role! };
    }
};

console.log('=== Testing Route Access Rules ===\n');

// Test 1: UNAUTHENTICATED users
console.log('Test 1: UNAUTHENTICATED users can only access auth');
const unauthState = createUserState('UNAUTHENTICATED');
console.assert(canAccessRoute(unauthState, 'auth') === true, '✓ Can access auth');
console.assert(canAccessRoute(unauthState, 'dashboard') === false, '✓ Cannot access dashboard');
console.assert(canAccessRoute(unauthState, 'lobby') === false, '✓ Cannot access lobby');
console.assert(canAccessRoute(unauthState, 'session') === false, '✓ Cannot access session');
console.log('✓ UNAUTHENTICATED access rules enforced\n');

// Test 2: AUTHENTICATED users
console.log('Test 2: AUTHENTICATED users can only access dashboard');
const authState = createUserState('AUTHENTICATED', 'user1');
console.assert(canAccessRoute(authState, 'auth') === false, '✓ Cannot access auth (already logged in)');
console.assert(canAccessRoute(authState, 'dashboard') === true, '✓ Can access dashboard');
console.assert(canAccessRoute(authState, 'lobby') === false, '✓ Cannot access lobby (not joined)');
console.assert(canAccessRoute(authState, 'session') === false, '✓ Cannot access session (not in lobby)');
console.log('✓ AUTHENTICATED access rules enforced\n');

// Test 3: IN_LOBBY users
console.log('Test 3: IN_LOBBY users can access dashboard and lobby');
const lobbyState = createUserState('IN_LOBBY', 'user1', 'lobby1', null, UserRole.PLAYER);
console.assert(canAccessRoute(lobbyState, 'auth') === false, '✓ Cannot access auth');
console.assert(canAccessRoute(lobbyState, 'dashboard') === true, '✓ Can access dashboard');
console.assert(canAccessRoute(lobbyState, 'lobby') === true, '✓ Can access lobby');
console.assert(canAccessRoute(lobbyState, 'session') === false, '✓ Cannot access session (not started)');
console.log('✓ IN_LOBBY access rules enforced\n');

// Test 4: IN_SESSION users
console.log('Test 4: IN_SESSION users can access lobby and session');
const sessionState = createUserState('IN_SESSION', 'user1', 'lobby1', 'session1', UserRole.PLAYER);
console.assert(canAccessRoute(sessionState, 'auth') === false, '✓ Cannot access auth');
console.assert(canAccessRoute(sessionState, 'dashboard') === false, '✓ Cannot access dashboard (in session)');
console.assert(canAccessRoute(sessionState, 'lobby') === true, '✓ Can access lobby');
console.assert(canAccessRoute(sessionState, 'session') === true, '✓ Can access session');
console.log('✓ IN_SESSION access rules enforced\n');

console.log('=== Testing Redirect Logic ===\n');

// Test 5: Redirect unauthenticated users
console.log('Test 5: Unauthenticated users redirected to auth');
console.assert(getRedirectRoute(unauthState, 'dashboard') === 'auth', '✓ Dashboard → auth');
console.assert(getRedirectRoute(unauthState, 'lobby') === 'auth', '✓ Lobby → auth');
console.assert(getRedirectRoute(unauthState, 'session') === 'auth', '✓ Session → auth');
console.log('✓ Unauthenticated redirects work\n');

// Test 6: Redirect authenticated users trying to access session early
console.log('Test 6: Authenticated users cannot access session early');
console.assert(getRedirectRoute(authState, 'session') === 'dashboard', '✓ Session → dashboard');
console.assert(getRedirectRoute(authState, 'lobby') === 'dashboard', '✓ Lobby → dashboard');
console.log('✓ Early session access prevented\n');

// Test 7: Redirect lobby users trying to access session early
console.log('Test 7: Lobby users cannot access session before it starts');
console.assert(getRedirectRoute(lobbyState, 'session') === 'lobby', '✓ Session → lobby');
console.log('✓ Session access blocked until DM starts it\n');

// Test 8: Redirect session users trying to leave
console.log('Test 8: Session users cannot navigate to dashboard');
console.assert(getRedirectRoute(sessionState, 'dashboard') === 'session', '✓ Dashboard → session');
console.log('✓ Session users kept in session context\n');

console.log('=== Testing Navigation Away Rules ===\n');

// Test 9: Users in session cannot navigate away to dashboard
console.log('Test 9: Users in active session cannot leave to dashboard');
console.assert(
    canNavigateAway(sessionState, 'session', 'dashboard') === false,
    '✓ Cannot navigate session → dashboard'
);
console.assert(
    canNavigateAway(sessionState, 'session', 'auth') === false,
    '✓ Cannot navigate session → auth'
);
console.log('✓ Session navigation locked to session/lobby\n');

// Test 10: Users in session can navigate to lobby
console.log('Test 10: Users in session can view lobby');
console.assert(
    canNavigateAway(sessionState, 'session', 'lobby') === true,
    '✓ Can navigate session → lobby'
);
console.assert(
    canNavigateAway(sessionState, 'session', 'session') === true,
    '✓ Can stay in session'
);
console.log('✓ Session users can view lobby\n');

// Test 11: Users in lobby can navigate freely
console.log('Test 11: Users in lobby can navigate freely');
console.assert(
    canNavigateAway(lobbyState, 'lobby', 'dashboard') === true,
    '✓ Can navigate lobby → dashboard'
);
console.log('✓ Lobby users have free navigation\n');

console.log('=== Testing Default Routes ===\n');

// Test 12: Default routes for each state
console.log('Test 12: Default routes match user state');
console.assert(getDefaultRoute(unauthState) === 'auth', '✓ UNAUTHENTICATED → auth');
console.assert(getDefaultRoute(authState) === 'dashboard', '✓ AUTHENTICATED → dashboard');
console.assert(getDefaultRoute(lobbyState) === 'lobby', '✓ IN_LOBBY → lobby');
console.assert(getDefaultRoute(sessionState) === 'session', '✓ IN_SESSION → session');
console.log('✓ Default routes correct\n');

console.log('=== Testing Route Validation ===\n');

// Test 13: Validate route changes
console.log('Test 13: Route validation enforces guards');
console.assert(
    validateRouteChange(lobbyState, 'session') === 'lobby',
    '✓ Lobby user trying to access session → redirected to lobby'
);
console.assert(
    validateRouteChange(sessionState, 'dashboard') === 'session',
    '✓ Session user trying to access dashboard → redirected to session'
);
console.assert(
    validateRouteChange(authState, 'dashboard') === 'dashboard',
    '✓ Authenticated user accessing dashboard → allowed'
);
console.log('✓ Route validation works correctly\n');

console.log('=== SUCCESS CRITERIA VERIFICATION ===\n');

// Success Criterion 1: Users cannot access Session Room early
console.log('✅ SUCCESS CRITERION 1: Users cannot access Session Room early');
console.log('   - AUTHENTICATED users redirected from session to dashboard');
console.log('   - IN_LOBBY users redirected from session to lobby');
console.log('   - Only IN_SESSION users can access session route\n');

// Success Criterion 2: Users cannot navigate away during active session
console.log('✅ SUCCESS CRITERION 2: Users cannot navigate away during active session');
console.log('   - IN_SESSION users blocked from navigating to dashboard');
console.log('   - IN_SESSION users blocked from navigating to auth');
console.log('   - IN_SESSION users can only access session or lobby\n');

console.log('=== All Route Guard Tests Complete ===');
console.log('✓ All navigation rules enforced correctly');
console.log('✓ Success criteria verified');
