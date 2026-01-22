# Route Guards - Visual Flow Diagrams

## User State → Route Access Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     UNAUTHENTICATED                             │
│                                                                 │
│  Allowed Routes:  ✅ /auth                                     │
│  Blocked Routes:  ❌ /dashboard → redirect to /auth            │
│                   ❌ /lobby → redirect to /auth                │
│                   ❌ /session → redirect to /auth              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ login/signup
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATED                              │
│                                                                 │
│  Allowed Routes:  ✅ /dashboard                                │
│  Blocked Routes:  ❌ /auth → redirect to /dashboard            │
│                   ❌ /lobby → redirect to /dashboard           │
│                   ❌ /session → redirect to /dashboard         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ joinLobby()
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        IN_LOBBY                                 │
│                                                                 │
│  Allowed Routes:  ✅ /dashboard                                │
│                   ✅ /lobby                                    │
│  Blocked Routes:  ❌ /auth → redirect to /lobby                │
│                   ❌ /session → redirect to /lobby             │
│                      (Session not started yet!)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ enterSession() [DM starts]
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       IN_SESSION                                │
│                                                                 │
│  Allowed Routes:  ✅ /session                                  │
│                   ✅ /lobby (can view members)                 │
│  Blocked Routes:  ❌ /auth → redirect to /session              │
│                   ❌ /dashboard → redirect to /session         │
│                      (Cannot leave active session!)             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Navigation Guard Flow

```
User clicks navigation button
         │
         ↓
┌────────────────────────────┐
│  handlePageChange(route)   │
│  in App.tsx                │
└────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  Guard Check 1: Can Navigate Away?                        │
│  canNavigateAway(userState, currentRoute, targetRoute)    │
└────────────────────────────────────────────────────────────┘
         │
         ├─── NO ──→ Block navigation, show warning, STOP
         │
         ↓ YES
┌────────────────────────────────────────────────────────────┐
│  Guard Check 2: Validate Route                            │
│  validateRouteChange(userState, requestedRoute)           │
└────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  canAccessRoute(userState, route)?                        │
└────────────────────────────────────────────────────────────┘
         │
         ├─── YES ──→ Allow navigation to requested route
         │
         ↓ NO
┌────────────────────────────────────────────────────────────┐
│  getRedirectRoute(userState, attemptedRoute)              │
│  Returns appropriate redirect                             │
└────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  setCurrentPage(validatedRoute)                           │
│  Navigate to allowed route                                │
└────────────────────────────────────────────────────────────┘
```

---

## Success Criterion 1: Cannot Access Session Early

```
Scenario: AUTHENTICATED user tries to access /session

User State: AUTHENTICATED
Requested Route: /session

         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  canAccessRoute(AUTHENTICATED, 'session')                 │
│                                                            │
│  Check: state === AUTHENTICATED?  ✓ YES                   │
│  Return: route === 'dashboard'?   ✗ NO                    │
│  Result: FALSE                                            │
└────────────────────────────────────────────────────────────┘
         │
         ↓ Access Denied
┌────────────────────────────────────────────────────────────┐
│  getRedirectRoute(AUTHENTICATED, 'session')               │
│                                                            │
│  Check: state === AUTHENTICATED?  ✓ YES                   │
│  Return: 'dashboard'                                      │
└────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  User redirected to /dashboard                            │
│  ✅ SUCCESS: Cannot access session early                  │
└────────────────────────────────────────────────────────────┘
```

```
Scenario: IN_LOBBY user tries to access /session

User State: IN_LOBBY
Requested Route: /session

         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  canAccessRoute(IN_LOBBY, 'session')                      │
│                                                            │
│  Check: state === IN_LOBBY?  ✓ YES                        │
│  Return: route === 'dashboard' || route === 'lobby'?      │
│          ✗ NO (session not included)                      │
│  Result: FALSE                                            │
└────────────────────────────────────────────────────────────┘
         │
         ↓ Access Denied
┌────────────────────────────────────────────────────────────┐
│  getRedirectRoute(IN_LOBBY, 'session')                    │
│                                                            │
│  Check: state === IN_LOBBY && route === 'session'?        │
│         ✓ YES                                             │
│  Return: 'lobby'                                          │
└────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  User redirected to /lobby                                │
│  ✅ SUCCESS: Must wait for DM to start session            │
└────────────────────────────────────────────────────────────┘
```

---

## Success Criterion 2: Cannot Navigate Away During Session

```
Scenario: IN_SESSION user tries to navigate to /dashboard

User State: IN_SESSION
Current Route: /session
Requested Route: /dashboard

         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  canNavigateAway(IN_SESSION, 'session', 'dashboard')      │
│                                                            │
│  Check: state === IN_SESSION && current === 'session'?    │
│         ✓ YES                                             │
│  Check: target === 'lobby' || target === 'session'?       │
│         ✗ NO (dashboard not allowed)                      │
│  Result: FALSE                                            │
└────────────────────────────────────────────────────────────┘
         │
         ↓ Navigation Blocked
┌────────────────────────────────────────────────────────────┐
│  console.warn("Navigation blocked: Cannot leave session") │
│  return; // Stop execution                                │
└────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  User stays on /session                                   │
│  ✅ SUCCESS: Cannot leave active session                  │
└────────────────────────────────────────────────────────────┘
```

```
Scenario: IN_SESSION user navigates to /lobby (allowed)

User State: IN_SESSION
Current Route: /session
Requested Route: /lobby

         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  canNavigateAway(IN_SESSION, 'session', 'lobby')          │
│                                                            │
│  Check: state === IN_SESSION && current === 'session'?    │
│         ✓ YES                                             │
│  Check: target === 'lobby' || target === 'session'?       │
│         ✓ YES (lobby is allowed)                          │
│  Result: TRUE                                             │
└────────────────────────────────────────────────────────────┘
         │
         ↓ Navigation Allowed
┌────────────────────────────────────────────────────────────┐
│  validateRouteChange(IN_SESSION, 'lobby')                 │
│  canAccessRoute(IN_SESSION, 'lobby') → TRUE               │
│  Return: 'lobby'                                          │
└────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  User navigates to /lobby                                 │
│  ✅ SUCCESS: Can view members during session              │
└────────────────────────────────────────────────────────────┘
```

---

## State Transition Integration

```
┌─────────────────────────────────────────────────────────────┐
│                   User Action Flow                          │
└─────────────────────────────────────────────────────────────┘

User clicks "Join Lobby" button
         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  GameStateContext.joinLobby('lobby-123', UserRole.PLAYER) │
└────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  transitionUserState(                                     │
│    current: AUTHENTICATED,                                │
│    target: IN_LOBBY,                                      │
│    context: { lobbyId, role }                             │
│  )                                                        │
└────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  State validation passes ✓                                │
│  New state: IN_LOBBY                                      │
└────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  setUserState(newState)                                   │
│  Context updated                                          │
└────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  App.tsx useEffect triggered                              │
│  Dependency: userState changed                            │
└────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  validateRouteChange(IN_LOBBY, currentPage)               │
│  Current page: 'dashboard'                                │
│  Can access dashboard? YES ✓                              │
│  No redirect needed                                       │
└────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────┐
│  User can now navigate to /lobby                          │
│  Navigation buttons updated                               │
└────────────────────────────────────────────────────────────┘
```

---

## Route Access Matrix (Visual)

```
┌──────────────┬─────────┬─────────────┬─────────┬──────────┐
│   State      │  /auth  │ /dashboard  │ /lobby  │ /session │
├──────────────┼─────────┼─────────────┼─────────┼──────────┤
│ UNAUTH       │   ✅    │  ❌ → auth  │ ❌ → a  │ ❌ → a   │
├──────────────┼─────────┼─────────────┼─────────┼──────────┤
│ AUTH         │ ❌ → d  │     ✅      │ ❌ → d  │ ❌ → d   │
├──────────────┼─────────┼─────────────┼─────────┼──────────┤
│ IN_LOBBY     │ ❌ → l  │     ✅      │   ✅    │ ❌ → l   │
├──────────────┼─────────┼─────────────┼─────────┼──────────┤
│ IN_SESSION   │ ❌ → s  │  ❌ → s     │   ✅    │   ✅     │
└──────────────┴─────────┴─────────────┴─────────┴──────────┘

Legend:
  ✅ = Allowed
  ❌ = Blocked
  → a = Redirect to /auth
  → d = Redirect to /dashboard
  → l = Redirect to /lobby
  → s = Redirect to /session
```
