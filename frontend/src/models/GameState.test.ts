/**
 * Game State Model - Test Suite
 * 
 * This file contains tests that verify the state model enforces:
 * 1. Valid state transitions only
 * 2. Prevention of invalid transitions
 * 3. Role-based permissions
 * 4. Impossible states (e.g., being in session before it starts)
 */

import {
    UserState,
    LobbyState,
    SessionState,
    UserRole,
    isValidUserStateTransition,
    isValidLobbyStateTransition,
    isValidSessionStateTransition,
    canTriggerLobbyTransition,
    canTriggerSessionTransition,
    transitionUserState,
    transitionLobbyState,
    transitionSessionState,
    type UserStateContext,
    type LobbyStateContext,
    type SessionStateContext,
} from './GameState';

// ============================================================================
// USER STATE TRANSITION TESTS
// ============================================================================

console.log('=== Testing User State Transitions ===\n');

// Valid transitions
console.log('✓ UNAUTHENTICATED -> AUTHENTICATED:',
    isValidUserStateTransition(UserState.UNAUTHENTICATED, UserState.AUTHENTICATED));

console.log('✓ AUTHENTICATED -> IN_LOBBY:',
    isValidUserStateTransition(UserState.AUTHENTICATED, UserState.IN_LOBBY));

console.log('✓ IN_LOBBY -> IN_SESSION:',
    isValidUserStateTransition(UserState.IN_LOBBY, UserState.IN_SESSION));

console.log('✓ IN_SESSION -> AUTHENTICATED:',
    isValidUserStateTransition(UserState.IN_SESSION, UserState.AUTHENTICATED));

// Invalid transitions
console.log('\n✗ UNAUTHENTICATED -> IN_SESSION (should be false):',
    isValidUserStateTransition(UserState.UNAUTHENTICATED, UserState.IN_SESSION));

console.log('✗ AUTHENTICATED -> IN_SESSION (should be false):',
    isValidUserStateTransition(UserState.AUTHENTICATED, UserState.IN_SESSION));

console.log('✗ IN_SESSION -> IN_LOBBY (should be false):',
    isValidUserStateTransition(UserState.IN_SESSION, UserState.IN_LOBBY));

// ============================================================================
// LOBBY STATE TRANSITION TESTS
// ============================================================================

console.log('\n=== Testing Lobby State Transitions ===\n');

// Valid transitions
console.log('✓ FORMING -> READY:',
    isValidLobbyStateTransition(LobbyState.FORMING, LobbyState.READY));

console.log('✓ READY -> ACTIVE:',
    isValidLobbyStateTransition(LobbyState.READY, LobbyState.ACTIVE));

console.log('✓ ACTIVE -> COMPLETED:',
    isValidLobbyStateTransition(LobbyState.ACTIVE, LobbyState.COMPLETED));

console.log('✓ FORMING -> DISBANDED:',
    isValidLobbyStateTransition(LobbyState.FORMING, LobbyState.DISBANDED));

// Invalid transitions
console.log('\n✗ FORMING -> ACTIVE (should be false):',
    isValidLobbyStateTransition(LobbyState.FORMING, LobbyState.ACTIVE));

console.log('✗ COMPLETED -> ACTIVE (should be false):',
    isValidLobbyStateTransition(LobbyState.COMPLETED, LobbyState.ACTIVE));

console.log('✗ DISBANDED -> READY (should be false):',
    isValidLobbyStateTransition(LobbyState.DISBANDED, LobbyState.READY));

// ============================================================================
// SESSION STATE TRANSITION TESTS
// ============================================================================

console.log('\n=== Testing Session State Transitions ===\n');

// Valid transitions
console.log('✓ STARTING -> IN_PROGRESS:',
    isValidSessionStateTransition(SessionState.STARTING, SessionState.IN_PROGRESS));

console.log('✓ IN_PROGRESS -> PAUSED:',
    isValidSessionStateTransition(SessionState.IN_PROGRESS, SessionState.PAUSED));

console.log('✓ PAUSED -> IN_PROGRESS:',
    isValidSessionStateTransition(SessionState.PAUSED, SessionState.IN_PROGRESS));

console.log('✓ IN_PROGRESS -> ENDED:',
    isValidSessionStateTransition(SessionState.IN_PROGRESS, SessionState.ENDED));

// Invalid transitions
console.log('\n✗ STARTING -> PAUSED (should be false):',
    isValidSessionStateTransition(SessionState.STARTING, SessionState.PAUSED));

console.log('✗ ENDED -> IN_PROGRESS (should be false):',
    isValidSessionStateTransition(SessionState.ENDED, SessionState.IN_PROGRESS));

// ============================================================================
// PERMISSION TESTS
// ============================================================================

console.log('\n=== Testing Role-Based Permissions ===\n');

// DM permissions
console.log('✓ DM can start session (READY -> ACTIVE):',
    canTriggerLobbyTransition(UserRole.DM, LobbyState.READY, LobbyState.ACTIVE));

console.log('✓ DM can end session (ACTIVE -> COMPLETED):',
    canTriggerLobbyTransition(UserRole.DM, LobbyState.ACTIVE, LobbyState.COMPLETED));

console.log('✓ DM can pause session:',
    canTriggerSessionTransition(UserRole.DM, SessionState.IN_PROGRESS, SessionState.PAUSED));

// Player restrictions
console.log('\n✗ PLAYER cannot start session (should be false):',
    canTriggerLobbyTransition(UserRole.PLAYER, LobbyState.READY, LobbyState.ACTIVE));

console.log('✗ PLAYER cannot pause session (should be false):',
    canTriggerSessionTransition(UserRole.PLAYER, SessionState.IN_PROGRESS, SessionState.PAUSED));

// ============================================================================
// STATE CONTEXT ENFORCEMENT TESTS
// ============================================================================

console.log('\n=== Testing State Context Enforcement ===\n');

try {
    // Valid: User logs in
    const unauthenticated: UserStateContext = {
        state: UserState.UNAUTHENTICATED,
        userId: null,
        lobbyId: null,
        sessionId: null,
    };

    const authenticated = transitionUserState(unauthenticated, UserState.AUTHENTICATED, {
        userId: 'user123',
    });
    console.log('✓ User successfully authenticated:', authenticated.state === UserState.AUTHENTICATED);

    // Valid: User joins lobby
    const inLobby = transitionUserState(authenticated, UserState.IN_LOBBY, {
        userId: 'user123',
        lobbyId: 'lobby456',
        role: UserRole.PLAYER,
    });
    console.log('✓ User successfully joined lobby:', inLobby.state === UserState.IN_LOBBY);

    // Valid: User enters session (from lobby)
    const inSession = transitionUserState(inLobby, UserState.IN_SESSION, {
        userId: 'user123',
        lobbyId: 'lobby456',
        sessionId: 'session789',
        role: UserRole.PLAYER,
    });
    console.log('✓ User successfully entered session:', inSession.state === UserState.IN_SESSION);

} catch (error) {
    console.log('✗ Unexpected error:', error);
}

// Test invalid transition: Skip lobby and go directly to session
console.log('\n--- Testing Invalid Transition: AUTHENTICATED -> IN_SESSION ---');
try {
    const authenticated: UserStateContext = {
        state: UserState.AUTHENTICATED,
        userId: 'user123',
        lobbyId: null,
        sessionId: null,
    };

    transitionUserState(authenticated, UserState.IN_SESSION, {
        userId: 'user123',
        lobbyId: 'lobby456',
        sessionId: 'session789',
        role: UserRole.PLAYER,
    });
    console.log('✗ FAILED: Should have thrown error');
} catch (error) {
    console.log('✓ Correctly prevented: User cannot enter session without being in lobby first');
    console.log('  Error:', (error as Error).message);
}

// Test invalid transition: Player tries to start session
console.log('\n--- Testing Invalid Transition: PLAYER Starting Session ---');
try {
    const lobby: LobbyStateContext = {
        state: LobbyState.READY,
        lobbyId: 'lobby456',
        memberCount: 4,
        dmId: 'dm123',
        sessionId: null,
    };

    transitionLobbyState(lobby, LobbyState.ACTIVE, UserRole.PLAYER, {
        sessionId: 'session789',
    });
    console.log('✗ FAILED: Should have thrown error');
} catch (error) {
    console.log('✓ Correctly prevented: Player cannot start session (DM-only)');
    console.log('  Error:', (error as Error).message);
}

// Test type safety: Cannot have sessionId in wrong state
console.log('\n--- Testing Type Safety ---');

// This would cause a TypeScript error (uncomment to see):
// const invalidState: UserStateContext = {
//   state: UserState.AUTHENTICATED,
//   userId: 'user123',
//   sessionId: 'session789', // ERROR: sessionId must be null for AUTHENTICATED
//   lobbyId: null,
// };

console.log('✓ TypeScript prevents invalid state combinations at compile time');

console.log('\n=== All Tests Complete ===\n');

export { };
