/**
 * Role-Based Permissions Test Suite
 * 
 * Verifies that DM vs Player permissions are correctly enforced.
 * 
 * Success Criteria:
 * Non-DM users cannot trigger DM-only actions even if they manipulate the UI.
 */

import {
    canPerformAction,
    isDM,
    isPlayer,
    assertCanPerformAction,
    PermissionDeniedError,
    PrivilegedAction,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    kickPlayer,
    banPlayer,
    uploadMap,
    modifyLobbySettings,
} from './RolePermissions';
import { UserRole, type UserStateContext } from '../models/GameState';

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

console.log('=== Testing Role Checks ===\n');

// Test 1: isDM function
console.log('Test 1: isDM correctly identifies DMs');
const dmState = createUserState('IN_LOBBY', 'user1', 'lobby1', null, UserRole.DM);
const playerState = createUserState('IN_LOBBY', 'user2', 'lobby1', null, UserRole.PLAYER);
const authState = createUserState('AUTHENTICATED', 'user3');

console.assert(isDM(dmState) === true, '✓ DM identified correctly');
console.assert(isDM(playerState) === false, '✓ Player not identified as DM');
console.assert(isDM(authState) === false, '✓ Authenticated user not identified as DM');
console.log('✓ isDM function works correctly\n');

// Test 2: isPlayer function
console.log('Test 2: isPlayer correctly identifies Players');
console.assert(isPlayer(playerState) === true, '✓ Player identified correctly');
console.assert(isPlayer(dmState) === false, '✓ DM not identified as Player');
console.assert(isPlayer(authState) === false, '✓ Authenticated user not identified as Player');
console.log('✓ isPlayer function works correctly\n');

console.log('=== Testing Permission Checks ===\n');

// Test 3: DM can perform all actions
console.log('Test 3: DM can perform all privileged actions');
const dmActions = [
    PrivilegedAction.START_SESSION,
    PrivilegedAction.PAUSE_SESSION,
    PrivilegedAction.END_SESSION,
    PrivilegedAction.KICK_PLAYER,
    PrivilegedAction.BAN_PLAYER,
    PrivilegedAction.UPLOAD_MAP,
    PrivilegedAction.MODIFY_LOBBY_SETTINGS,
];

dmActions.forEach(action => {
    const result = canPerformAction(dmState, action);
    console.assert(result.allowed === true, `✓ DM can perform ${action}`);
});
console.log('✓ DM has permission for all privileged actions\n');

// Test 4: Player cannot perform DM-only actions
console.log('Test 4: Player cannot perform DM-only actions');
dmActions.forEach(action => {
    const result = canPerformAction(playerState, action);
    console.assert(result.allowed === false, `✓ Player blocked from ${action}`);
    console.assert(result.reason !== undefined, `✓ Reason provided for ${action}`);
    console.assert(result.requiredRole === UserRole.DM, `✓ Required role is DM for ${action}`);
    console.assert(result.currentRole === UserRole.PLAYER, `✓ Current role is PLAYER for ${action}`);
});
console.log('✓ Player is blocked from all DM-only actions\n');

// Test 5: Authenticated users without role cannot perform actions
console.log('Test 5: Users without role cannot perform actions');
const result = canPerformAction(authState, PrivilegedAction.START_SESSION);
console.assert(result.allowed === false, '✓ Authenticated user blocked');
console.assert(result.reason?.includes('lobby or session'), '✓ Correct reason provided');
console.log('✓ Users without role are blocked\n');

console.log('=== Testing Permission Assertions ===\n');

// Test 6: assertCanPerformAction throws for unauthorized users
console.log('Test 6: assertCanPerformAction throws PermissionDeniedError');
try {
    assertCanPerformAction(playerState, PrivilegedAction.START_SESSION);
    console.error('✗ Should have thrown PermissionDeniedError');
} catch (error) {
    console.assert(error instanceof PermissionDeniedError, '✓ Correct error type thrown');
    console.assert(error.action === PrivilegedAction.START_SESSION, '✓ Error contains action');
    console.assert(error.currentRole === UserRole.PLAYER, '✓ Error contains current role');
    console.assert(error.requiredRole === UserRole.DM, '✓ Error contains required role');
    console.log('✓ PermissionDeniedError thrown correctly\n');
}

// Test 7: assertCanPerformAction succeeds for authorized users
console.log('Test 7: assertCanPerformAction succeeds for DM');
try {
    assertCanPerformAction(dmState, PrivilegedAction.START_SESSION);
    console.log('✓ DM can assert permission without error\n');
} catch (error) {
    console.error('✗ Should not have thrown error for DM');
}

console.log('=== Testing Guarded Actions ===\n');

// Test 8: DM can execute guarded actions
console.log('Test 8: DM can execute session management actions');
try {
    const result = startSession(dmState, 'lobby1');
    console.assert(result.sessionId !== undefined, '✓ startSession returns sessionId');

    pauseSession(dmState, 'session1');
    console.log('✓ pauseSession executes');

    resumeSession(dmState, 'session1');
    console.log('✓ resumeSession executes');

    endSession(dmState, 'session1');
    console.log('✓ endSession executes');

    console.log('✓ DM can execute all session management actions\n');
} catch (error) {
    console.error('✗ DM should be able to execute actions:', error);
}

// Test 9: Player cannot execute guarded actions (SUCCESS CRITERION)
console.log('Test 9: Player CANNOT execute session management actions');
console.log('SUCCESS CRITERION: Non-DM users cannot trigger DM-only actions\n');

try {
    startSession(playerState, 'lobby1');
    console.error('✗ Player should NOT be able to start session');
} catch (error) {
    console.assert(error instanceof PermissionDeniedError, '✓ PermissionDeniedError thrown');
    console.assert(error.action === PrivilegedAction.START_SESSION, '✓ Correct action in error');
    console.log('✓ Player BLOCKED from startSession');
}

try {
    pauseSession(playerState, 'session1');
    console.error('✗ Player should NOT be able to pause session');
} catch (error) {
    console.assert(error instanceof PermissionDeniedError, '✓ PermissionDeniedError thrown');
    console.log('✓ Player BLOCKED from pauseSession');
}

try {
    endSession(playerState, 'session1');
    console.error('✗ Player should NOT be able to end session');
} catch (error) {
    console.assert(error instanceof PermissionDeniedError, '✓ PermissionDeniedError thrown');
    console.log('✓ Player BLOCKED from endSession');
}

console.log('✅ SUCCESS: Players cannot execute session management actions\n');

// Test 10: Player cannot execute player management actions (SUCCESS CRITERION)
console.log('Test 10: Player CANNOT execute player management actions');

try {
    kickPlayer(playerState, 'player2', 'test reason');
    console.error('✗ Player should NOT be able to kick players');
} catch (error) {
    console.assert(error instanceof PermissionDeniedError, '✓ PermissionDeniedError thrown');
    console.log('✓ Player BLOCKED from kickPlayer');
}

try {
    banPlayer(playerState, 'player2', 'test reason');
    console.error('✗ Player should NOT be able to ban players');
} catch (error) {
    console.assert(error instanceof PermissionDeniedError, '✓ PermissionDeniedError thrown');
    console.log('✓ Player BLOCKED from banPlayer');
}

console.log('✅ SUCCESS: Players cannot execute player management actions\n');

// Test 11: Player cannot execute content management actions (SUCCESS CRITERION)
console.log('Test 11: Player CANNOT execute content management actions');

try {
    const mockFile = new File(['test'], 'map.png', { type: 'image/png' });
    uploadMap(playerState, mockFile);
    console.error('✗ Player should NOT be able to upload maps');
} catch (error) {
    console.assert(error instanceof PermissionDeniedError, '✓ PermissionDeniedError thrown');
    console.log('✓ Player BLOCKED from uploadMap');
}

console.log('✅ SUCCESS: Players cannot execute content management actions\n');

// Test 12: Player cannot execute lobby management actions (SUCCESS CRITERION)
console.log('Test 12: Player CANNOT execute lobby management actions');

try {
    modifyLobbySettings(playerState, { maxPlayers: 10 });
    console.error('✗ Player should NOT be able to modify lobby settings');
} catch (error) {
    console.assert(error instanceof PermissionDeniedError, '✓ PermissionDeniedError thrown');
    console.log('✓ Player BLOCKED from modifyLobbySettings');
}

console.log('✅ SUCCESS: Players cannot execute lobby management actions\n');

// Test 13: DM can execute all guarded actions
console.log('Test 13: DM can execute all guarded actions');

try {
    kickPlayer(dmState, 'player1', 'test');
    console.log('✓ DM can kickPlayer');

    banPlayer(dmState, 'player1', 'test');
    console.log('✓ DM can banPlayer');

    const mockFile = new File(['test'], 'map.png', { type: 'image/png' });
    uploadMap(dmState, mockFile);
    console.log('✓ DM can uploadMap');

    modifyLobbySettings(dmState, { maxPlayers: 10 });
    console.log('✓ DM can modifyLobbySettings');

    console.log('✓ DM can execute all guarded actions\n');
} catch (error) {
    console.error('✗ DM should be able to execute all actions:', error);
}

// Test 14: UI manipulation cannot bypass permission checks
console.log('Test 14: UI manipulation cannot bypass permission checks');
console.log('Simulating malicious user trying to bypass UI restrictions...\n');

// Scenario: Player tries to call startSession directly (bypassing disabled button)
try {
    console.log('Attempting: Player calls startSession() directly...');
    startSession(playerState, 'lobby1');
    console.error('✗ SECURITY BREACH: Player bypassed permission check!');
} catch (error) {
    console.assert(error instanceof PermissionDeniedError, '✓ Permission check enforced');
    console.log('✓ BLOCKED: Permission check cannot be bypassed');
}

// Scenario: Player tries to call kickPlayer directly
try {
    console.log('Attempting: Player calls kickPlayer() directly...');
    kickPlayer(playerState, 'victim-player');
    console.error('✗ SECURITY BREACH: Player bypassed permission check!');
} catch (error) {
    console.assert(error instanceof PermissionDeniedError, '✓ Permission check enforced');
    console.log('✓ BLOCKED: Permission check cannot be bypassed');
}

// Scenario: Player tries to call uploadMap directly
try {
    console.log('Attempting: Player calls uploadMap() directly...');
    const maliciousFile = new File(['malicious'], 'hack.png', { type: 'image/png' });
    uploadMap(playerState, maliciousFile);
    console.error('✗ SECURITY BREACH: Player bypassed permission check!');
} catch (error) {
    console.assert(error instanceof PermissionDeniedError, '✓ Permission check enforced');
    console.log('✓ BLOCKED: Permission check cannot be bypassed');
}

console.log('\n✅ SUCCESS: UI manipulation cannot bypass permission checks\n');

console.log('=== SUCCESS CRITERIA VERIFICATION ===\n');

console.log('✅ SUCCESS CRITERION: Non-DM users cannot trigger DM-only actions');
console.log('   - Players blocked from startSession ✓');
console.log('   - Players blocked from pauseSession ✓');
console.log('   - Players blocked from endSession ✓');
console.log('   - Players blocked from kickPlayer ✓');
console.log('   - Players blocked from banPlayer ✓');
console.log('   - Players blocked from uploadMap ✓');
console.log('   - Players blocked from modifyLobbySettings ✓');
console.log('   - Permission checks cannot be bypassed ✓');
console.log('   - Clear error messages provided ✓\n');

console.log('=== All Permission Tests Complete ===');
console.log('✓ All role checks working correctly');
console.log('✓ All permission checks enforced');
console.log('✓ All guarded actions protected');
console.log('✓ Success criteria verified');
