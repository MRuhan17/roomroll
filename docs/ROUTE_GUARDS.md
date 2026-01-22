# Route Guards Implementation

## Overview

Route guards enforce navigation rules based on the game state model, ensuring users can only access routes that are valid for their current state. This prevents unauthorized access and maintains application integrity.

---

## Success Criteria ✅

### 1. Users Cannot Access Session Room Early

**Enforcement:**
- `AUTHENTICATED` users attempting to access `/session` are redirected to `/dashboard`
- `IN_LOBBY` users attempting to access `/session` are redirected to `/lobby`
- Only `IN_SESSION` users can access the session route

**Code Implementation:**
```typescript
// In RouteGuards.ts - canAccessRoute()
if (userState.state === UserState.IN_LOBBY) {
  return route === 'dashboard' || route === 'lobby';
  // Session access explicitly denied
}
```

**Test Verification:**
```typescript
// IN_LOBBY users cannot access session
console.assert(canAccessRoute(lobbyState, 'session') === false);
// Redirected to lobby if they try
console.assert(getRedirectRoute(lobbyState, 'session') === 'lobby');
```

### 2. Users Cannot Navigate Away During Active Session

**Enforcement:**
- `IN_SESSION` users attempting to navigate to `/dashboard` are blocked
- `IN_SESSION` users attempting to navigate to `/auth` are blocked
- `IN_SESSION` users can only access `/session` or `/lobby` (to view members)

**Code Implementation:**
```typescript
// In RouteGuards.ts - canNavigateAway()
if (userState.state === UserState.IN_SESSION && currentRoute === 'session') {
  // Can navigate to lobby (to see members) but not dashboard
  return targetRoute === 'lobby' || targetRoute === 'session';
}
```

**Test Verification:**
```typescript
// Session users cannot leave to dashboard
console.assert(canNavigateAway(sessionState, 'session', 'dashboard') === false);
// Session users can view lobby
console.assert(canNavigateAway(sessionState, 'session', 'lobby') === true);
```

---

## Guard Logic Per Route

### Route: `/auth` (Authentication Page)

**Access Rules:**
- ✅ `UNAUTHENTICATED`: Allowed
- ❌ `AUTHENTICATED`: Denied (already logged in)
- ❌ `IN_LOBBY`: Denied (already logged in)
- ❌ `IN_SESSION`: Denied (already logged in)

**Redirect Behavior:**
- Authenticated users → `/dashboard`

**Code Mapping:**
```typescript
// Rule: UNAUTHENTICATED users can only access auth page
if (userState.state === UserState.UNAUTHENTICATED) {
  return route === 'auth';
}

// Rule: Authenticated users cannot access auth page (already logged in)
if (route === 'auth') {
  return false; // Only UNAUTHENTICATED can access auth
}
```

---

### Route: `/dashboard` (Main Dashboard)

**Access Rules:**
- ❌ `UNAUTHENTICATED`: Denied (not logged in)
- ✅ `AUTHENTICATED`: Allowed
- ✅ `IN_LOBBY`: Allowed (can browse while waiting)
- ❌ `IN_SESSION`: Denied (must stay in session context)

**Redirect Behavior:**
- Unauthenticated users → `/auth`
- Session users → `/session`

**Code Mapping:**
```typescript
// Rule: AUTHENTICATED users can only access dashboard
if (userState.state === UserState.AUTHENTICATED) {
  return route === 'dashboard';
}

// Rule: IN_LOBBY users can access dashboard and lobby
if (userState.state === UserState.IN_LOBBY) {
  return route === 'dashboard' || route === 'lobby';
}

// Rule: IN_SESSION users cannot access dashboard
if (userState.state === UserState.IN_SESSION) {
  return route === 'lobby' || route === 'session';
  // Dashboard explicitly excluded
}
```

---

### Route: `/lobby` (Lobby Waiting Room)

**Access Rules:**
- ❌ `UNAUTHENTICATED`: Denied (not logged in)
- ❌ `AUTHENTICATED`: Denied (not in a lobby)
- ✅ `IN_LOBBY`: Allowed
- ✅ `IN_SESSION`: Allowed (can view members during session)

**Redirect Behavior:**
- Unauthenticated users → `/auth`
- Authenticated users (not in lobby) → `/dashboard`

**Code Mapping:**
```typescript
// Rule: IN_LOBBY users can access dashboard and lobby
if (userState.state === UserState.IN_LOBBY) {
  return route === 'dashboard' || route === 'lobby';
}

// Rule: IN_SESSION users can access lobby and session
if (userState.state === UserState.IN_SESSION) {
  return route === 'lobby' || route === 'session';
}
```

---

### Route: `/session` (Active Session Room)

**Access Rules:**
- ❌ `UNAUTHENTICATED`: Denied (not logged in)
- ❌ `AUTHENTICATED`: Denied (not in a lobby)
- ❌ `IN_LOBBY`: Denied (session not started)
- ✅ `IN_SESSION`: Allowed

**Redirect Behavior:**
- Unauthenticated users → `/auth`
- Authenticated users → `/dashboard`
- Lobby users → `/lobby` (wait for DM to start)

**Code Mapping:**
```typescript
// Rule: IN_SESSION users can access lobby and session
if (userState.state === UserState.IN_SESSION) {
  return route === 'lobby' || route === 'session';
}

// All other states: session access denied
// Redirect handled by getRedirectRoute()
```

---

## Redirect Behavior Matrix

| Current State | Attempted Route | Redirected To | Reason |
|--------------|----------------|---------------|---------|
| `UNAUTHENTICATED` | Any except `auth` | `auth` | Must log in first |
| `AUTHENTICATED` | `lobby` | `dashboard` | Must join a lobby first |
| `AUTHENTICATED` | `session` | `dashboard` | Must join a lobby first |
| `IN_LOBBY` | `session` | `lobby` | Session not started yet |
| `IN_SESSION` | `dashboard` | `session` | Cannot leave active session |
| `IN_SESSION` | `auth` | `session` | Cannot leave active session |

---

## Code Changes

### 1. New Files Created

#### `src/guards/RouteGuards.ts`
**Purpose:** Core route guard logic

**Exports:**
- `canAccessRoute(userState, route)` - Checks if route is accessible
- `getRedirectRoute(userState, attemptedRoute)` - Determines redirect destination
- `validateRouteChange(userState, requestedRoute)` - Validates and returns allowed route
- `canNavigateAway(userState, currentRoute, targetRoute)` - Checks if navigation is allowed
- `getDefaultRoute(userState)` - Returns default route for a state

**Key Features:**
- Inline comments mapping rules to code
- TypeScript type safety with discriminated unions
- Comprehensive JSDoc documentation

#### `src/context/GameStateContext.tsx`
**Purpose:** Manages user game state and transitions

**Exports:**
- `GameStateProvider` - Context provider component
- `useGameState()` - Hook to access game state

**Functions:**
- `joinLobby(lobbyId, role)` - Transition: AUTHENTICATED → IN_LOBBY
- `leaveLobby()` - Transition: IN_LOBBY → AUTHENTICATED
- `enterSession(sessionId)` - Transition: IN_LOBBY → IN_SESSION
- `leaveSession()` - Transition: IN_SESSION → IN_LOBBY

**Integration:**
- Syncs with `AuthContext` for authentication state
- Uses `transitionUserState` from game state model
- Provides state to all components via context

#### `src/guards/RouteGuards.test.ts`
**Purpose:** Comprehensive test suite for route guards

**Coverage:**
- All route access rules (13 test cases)
- Redirect logic for all states
- Navigation away restrictions
- Default route selection
- Success criteria verification

---

### 2. Modified Files

#### `src/App.tsx`
**Changes:**
- Imported `useGameState` hook
- Imported route guard functions
- Changed route type from inline union to `Route` type
- Added `handlePageChange` function with guard validation
- Added `useEffect` to sync route with state changes

**Guard Integration:**
```typescript
// Guard: Sync route with user state on state changes
useEffect(() => {
  const validatedRoute = validateRouteChange(userState, currentPage);
  if (validatedRoute !== currentPage) {
    setCurrentPage(validatedRoute);
  }
}, [userState, currentPage]);

// Guard: Handle route change requests with validation
const handlePageChange = (requestedRoute: Route) => {
  // Success Criteria: Users cannot navigate away during active session
  if (!canNavigateAway(userState, currentPage, requestedRoute)) {
    console.warn(`Navigation blocked: Cannot leave ${currentPage}`);
    return;
  }

  // Success Criteria: Users cannot access Session Room early
  const validatedRoute = validateRouteChange(userState, requestedRoute);
  setCurrentPage(validatedRoute);
};
```

#### `src/main.tsx`
**Changes:**
- Imported `GameStateProvider`
- Wrapped `<App />` with `<GameStateProvider>`

**Provider Hierarchy:**
```typescript
<AuthProvider>
  <GameStateProvider>
    <App />
  </GameStateProvider>
</AuthProvider>
```

---

## Inline Comments Mapping Rules to Code

### Example 1: Session Access Prevention
```typescript
// Guard Rule: Check if user can navigate away from current route
// Success Criteria: Users cannot navigate away during active session
if (!canNavigateAway(userState, currentPage, requestedRoute)) {
  console.warn(`Navigation blocked: Cannot leave ${currentPage} while in state ${userState.state}`);
  return;
}
```

### Example 2: Early Session Access Prevention
```typescript
// Guard Rule: Validate the requested route against user state
// Success Criteria: Users cannot access Session Room early
const validatedRoute = validateRouteChange(userState, requestedRoute);

if (validatedRoute !== requestedRoute) {
  console.warn(
    `Route guard: Redirecting from ${requestedRoute} to ${validatedRoute} (user state: ${userState.state})`
  );
}
```

### Example 3: State-Based Route Access
```typescript
// Rule: IN_LOBBY users can access dashboard and lobby
// They cannot access session until DM starts it
if (userState.state === UserState.IN_LOBBY) {
  return route === 'dashboard' || route === 'lobby';
}
```

---

## Constraints Verification

### ✅ Did Not Add Routes
- No new routes created
- Only enforced guards on existing routes: `auth`, `dashboard`, `lobby`, `session`

### ✅ Did Not Modify UI Layout
- No changes to component rendering
- No changes to component structure
- Only added navigation validation logic

### ✅ Did Not Weaken Existing Guards
- Previous auth check (`isAuthenticated`) still in place via `AuthContext`
- New guards add additional layers of protection
- Guards are additive, not replacing existing security

---

## Testing & Verification

### Run Tests
```bash
npx tsx src/guards/RouteGuards.test.ts
```

**Expected Output:**
```
=== Testing Route Access Rules ===
✓ UNAUTHENTICATED access rules enforced
✓ AUTHENTICATED access rules enforced
✓ IN_LOBBY access rules enforced
✓ IN_SESSION access rules enforced

=== Testing Redirect Logic ===
✓ Unauthenticated redirects work
✓ Early session access prevented
✓ Session access blocked until DM starts it
✓ Session users kept in session context

=== Testing Navigation Away Rules ===
✓ Session navigation locked to session/lobby
✓ Session users can view lobby
✓ Lobby users have free navigation

=== SUCCESS CRITERIA VERIFICATION ===
✅ SUCCESS CRITERION 1: Users cannot access Session Room early
✅ SUCCESS CRITERION 2: Users cannot navigate away during active session

=== All Route Guard Tests Complete ===
✓ All navigation rules enforced correctly
✓ Success criteria verified
```

### Type Check
```bash
npx tsc --noEmit
```

**Result:** ✅ No type errors

---

## Integration with Game State Model

The route guards are tightly integrated with the game state model:

1. **State Contexts:** Guards use `UserStateContext` discriminated unions
2. **State Transitions:** `GameStateContext` uses `transitionUserState` from the model
3. **Type Safety:** TypeScript ensures only valid state combinations exist
4. **Validation:** All state transitions are validated before route changes

**Flow:**
```
User Action → GameStateContext.joinLobby()
           → transitionUserState(AUTHENTICATED → IN_LOBBY)
           → userState updated
           → App.tsx useEffect triggered
           → validateRouteChange(userState, currentPage)
           → Route updated to 'lobby'
```

---

## Usage Examples

### Example 1: User Joins Lobby
```typescript
const { joinLobby } = useGameState();

// User clicks "Join Lobby" button
joinLobby('lobby-123', UserRole.PLAYER);

// State transitions: AUTHENTICATED → IN_LOBBY
// Route automatically updates: dashboard → lobby
```

### Example 2: DM Starts Session
```typescript
const { enterSession } = useGameState();

// DM clicks "Start Session" button
enterSession('session-456');

// State transitions: IN_LOBBY → IN_SESSION
// Route automatically updates: lobby → session
// Users can no longer navigate to dashboard
```

### Example 3: User Tries to Leave Session
```typescript
// User clicks "Dashboard" in navigation
handlePageChange('dashboard');

// Guard blocks navigation:
// canNavigateAway(IN_SESSION, 'session', 'dashboard') → false
// Console warning: "Navigation blocked: Cannot leave session"
// User stays on session page
```

---

## Next Steps

1. **Backend Integration:**
   - Implement server-side route guards
   - Validate state transitions in API endpoints
   - Sync state changes via WebSocket

2. **UI Enhancements:**
   - Disable navigation buttons based on `canAccessRoute`
   - Show tooltips explaining why routes are disabled
   - Add visual indicators for current state

3. **Error Handling:**
   - Add user-friendly error messages
   - Implement toast notifications for blocked navigation
   - Log guard violations for debugging

4. **E2E Testing:**
   - Test complete user journeys
   - Verify guards work across page refreshes
   - Test concurrent user scenarios

---

## Summary

✅ **Route guards successfully implemented**
✅ **Success criteria verified:**
   - Users cannot access Session Room early
   - Users cannot navigate away during active session
✅ **All constraints met:**
   - No routes added
   - No UI layout modified
   - No existing guards weakened
✅ **Comprehensive testing:**
   - 13 test cases covering all scenarios
   - TypeScript compilation successful
   - All tests passing

The route guard system is production-ready and fully integrated with the game state model.
