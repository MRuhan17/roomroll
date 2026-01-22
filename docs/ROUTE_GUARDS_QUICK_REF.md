# Route Guards - Quick Reference

## Success Criteria ✅

### 1. Users Cannot Access Session Room Early
- ❌ `AUTHENTICATED` users → `/session` redirected to `/dashboard`
- ❌ `IN_LOBBY` users → `/session` redirected to `/lobby`
- ✅ Only `IN_SESSION` users can access `/session`

### 2. Users Cannot Navigate Away During Active Session
- ❌ `IN_SESSION` users → `/dashboard` blocked
- ❌ `IN_SESSION` users → `/auth` blocked
- ✅ `IN_SESSION` users can only access `/session` or `/lobby`

---

## Route Access Matrix

| State | `/auth` | `/dashboard` | `/lobby` | `/session` |
|-------|---------|--------------|----------|------------|
| `UNAUTHENTICATED` | ✅ | ❌ → auth | ❌ → auth | ❌ → auth |
| `AUTHENTICATED` | ❌ → dashboard | ✅ | ❌ → dashboard | ❌ → dashboard |
| `IN_LOBBY` | ❌ → lobby | ✅ | ✅ | ❌ → lobby |
| `IN_SESSION` | ❌ → session | ❌ → session | ✅ | ✅ |

---

## API Reference

### `canAccessRoute(userState, route): boolean`
Checks if a user can access a specific route.

```typescript
const canAccess = canAccessRoute(userState, 'session');
// Returns true if allowed, false otherwise
```

### `validateRouteChange(userState, requestedRoute): Route`
Validates a route change and returns the allowed route.

```typescript
const allowedRoute = validateRouteChange(userState, 'session');
// Returns 'session' if allowed, or redirect route if denied
```

### `canNavigateAway(userState, currentRoute, targetRoute): boolean`
Checks if a user can navigate away from their current route.

```typescript
const canLeave = canNavigateAway(userState, 'session', 'dashboard');
// Returns false for IN_SESSION users trying to leave
```

### `getDefaultRoute(userState): Route`
Gets the default route for a given user state.

```typescript
const defaultRoute = getDefaultRoute(userState);
// Returns 'auth', 'dashboard', 'lobby', or 'session'
```

---

## GameStateContext API

### `useGameState()`
Hook to access game state and transition functions.

```typescript
const { userState, joinLobby, leaveLobby, enterSession, leaveSession } = useGameState();
```

### State Transitions

```typescript
// Join a lobby (AUTHENTICATED → IN_LOBBY)
joinLobby('lobby-id', UserRole.PLAYER);

// Leave a lobby (IN_LOBBY → AUTHENTICATED)
leaveLobby();

// Enter a session (IN_LOBBY → IN_SESSION)
enterSession('session-id');

// Leave a session (IN_SESSION → IN_LOBBY)
leaveSession();
```

---

## Testing

```bash
# Run route guard tests
npx tsx src/guards/RouteGuards.test.ts

# Type check
npx tsc --noEmit

# Run dev server
npm run dev
```

---

## Files

- **Implementation:** `src/guards/RouteGuards.ts`
- **Context:** `src/context/GameStateContext.tsx`
- **Tests:** `src/guards/RouteGuards.test.ts`
- **Integration:** `src/App.tsx`, `src/main.tsx`
- **Documentation:** `docs/ROUTE_GUARDS.md`
