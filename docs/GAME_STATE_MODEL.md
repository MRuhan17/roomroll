# Core Game State Model

## Overview

This document defines the **single source of truth** for Roomroll's game state management. It covers:
- User progression through the application
- Lobby participation and lifecycle
- Session management and control

## Design Principles

1. **Mutual Exclusivity**: A user/lobby/session can only be in ONE state at a time
2. **Explicit Transitions**: All state changes are validated and must follow defined paths
3. **Role-Based Control**: Only authorized roles can trigger certain transitions
4. **Type Safety**: TypeScript discriminated unions prevent invalid state combinations at compile time

---

## State Definitions

### User States

Users progress through four distinct states:

```
UNAUTHENTICATED → AUTHENTICATED → IN_LOBBY → IN_SESSION
                       ↑              ↓          ↓
                       └──────────────┴──────────┘
```

| State | Description | Can Transition To | Triggered By |
|-------|-------------|-------------------|--------------|
| `UNAUTHENTICATED` | User is not logged in | `AUTHENTICATED` | Login/Signup |
| `AUTHENTICATED` | User is logged in but not in any lobby | `IN_LOBBY`, `UNAUTHENTICATED` | Join/Create lobby, Logout |
| `IN_LOBBY` | User is in a lobby waiting for session | `IN_SESSION`, `AUTHENTICATED` | DM starts session, Leave lobby |
| `IN_SESSION` | User is actively in a game session | `AUTHENTICATED` | Session ends, User leaves |

**Invariant**: A user cannot enter `IN_SESSION` without first being `IN_LOBBY`.

---

### Lobby States

Lobbies follow a lifecycle from creation to completion:

```
FORMING → READY → ACTIVE → COMPLETED
   ↓         ↓
   └─────────┴──→ DISBANDED
```

| State | Description | Can Transition To | Triggered By |
|-------|-------------|-------------------|--------------|
| `FORMING` | Lobby is being created, waiting for minimum members | `READY`, `DISBANDED` | Min members joined, DM cancels |
| `READY` | Lobby has enough members and can start | `ACTIVE`, `DISBANDED` | DM starts session, All leave |
| `ACTIVE` | Session is in progress | `COMPLETED` | DM ends session |
| `COMPLETED` | Session has ended (terminal) | None | - |
| `DISBANDED` | Lobby was cancelled (terminal) | None | - |

**Invariant**: Only the DM can transition `READY → ACTIVE` (start session).

---

### Session States

Sessions have a simple lifecycle once started:

```
STARTING → IN_PROGRESS ⇄ PAUSED → ENDED
```

| State | Description | Can Transition To | Triggered By |
|-------|-------------|-------------------|--------------|
| `STARTING` | Session is initializing | `IN_PROGRESS` | Initialization complete |
| `IN_PROGRESS` | Session is actively running | `PAUSED`, `ENDED` | DM pauses/ends |
| `PAUSED` | Session is temporarily paused | `IN_PROGRESS`, `ENDED` | DM resumes/ends |
| `ENDED` | Session has concluded (terminal) | None | - |

**Invariant**: Only the DM can control session state transitions.

---

## User Roles

| Role | Permissions |
|------|-------------|
| `DM` (Dungeon Master) | Can start/pause/resume/end sessions, disband lobbies |
| `PLAYER` | Can join/leave lobbies, participate in sessions |

---

## Type-Safe State Contexts

The state model uses TypeScript discriminated unions to enforce valid state combinations:

### UserStateContext

```typescript
type UserStateContext =
  | { state: 'UNAUTHENTICATED'; userId: null; lobbyId: null; sessionId: null }
  | { state: 'AUTHENTICATED'; userId: string; lobbyId: null; sessionId: null }
  | { state: 'IN_LOBBY'; userId: string; lobbyId: string; sessionId: null; role: UserRole }
  | { state: 'IN_SESSION'; userId: string; lobbyId: string; sessionId: string; role: UserRole };
```

**What this prevents:**
- ❌ Having a `sessionId` while `AUTHENTICATED` (compile error)
- ❌ Being `IN_SESSION` without a `lobbyId` (compile error)
- ❌ Being `UNAUTHENTICATED` with a `userId` (compile error)

### LobbyStateContext

```typescript
type LobbyStateContext =
  | { state: 'FORMING'; lobbyId: string; memberCount: number; dmId: string; sessionId: null }
  | { state: 'READY'; lobbyId: string; memberCount: number; dmId: string; sessionId: null }
  | { state: 'ACTIVE'; lobbyId: string; memberCount: number; dmId: string; sessionId: string }
  | { state: 'COMPLETED'; lobbyId: string; memberCount: number; dmId: string; sessionId: string }
  | { state: 'DISBANDED'; lobbyId: string; memberCount: number; dmId: string; sessionId: null };
```

**What this prevents:**
- ❌ Having a `sessionId` before lobby is `ACTIVE` (compile error)
- ❌ Missing `sessionId` when lobby is `ACTIVE` (compile error)

### SessionStateContext

```typescript
type SessionStateContext =
  | { state: 'STARTING'; sessionId: string; lobbyId: string }
  | { state: 'IN_PROGRESS'; sessionId: string; lobbyId: string }
  | { state: 'PAUSED'; sessionId: string; lobbyId: string }
  | { state: 'ENDED'; sessionId: string; lobbyId: string };
```

**What this prevents:**
- ❌ Session existing without a `lobbyId` (compile error)

---

## Validation Functions

### State Transition Validators

```typescript
isValidUserStateTransition(from: UserState, to: UserState): boolean
isValidLobbyStateTransition(from: LobbyState, to: LobbyState): boolean
isValidSessionStateTransition(from: SessionState, to: SessionState): boolean
```

These functions check if a state transition is allowed based on the state machine definition.

### Permission Validators

```typescript
canTriggerLobbyTransition(role: UserRole, from: LobbyState, to: LobbyState): boolean
canTriggerSessionTransition(role: UserRole, from: SessionState, to: SessionState): boolean
```

These functions check if a user with a given role is authorized to trigger a specific transition.

---

## State Transition Functions

### transitionUserState

```typescript
transitionUserState(
  current: UserStateContext,
  newState: UserState,
  context?: Partial<UserStateContext>
): UserStateContext
```

**Behavior:**
- Validates the transition is allowed
- Requires appropriate context (e.g., `userId` for `AUTHENTICATED`)
- **Enforces**: User must be `IN_LOBBY` before entering `IN_SESSION`
- Throws error if transition is invalid or context is missing

**Example:**
```typescript
const authenticated = transitionUserState(
  { state: 'UNAUTHENTICATED', userId: null, lobbyId: null, sessionId: null },
  UserState.AUTHENTICATED,
  { userId: 'user123' }
);
// Result: { state: 'AUTHENTICATED', userId: 'user123', lobbyId: null, sessionId: null }
```

### transitionLobbyState

```typescript
transitionLobbyState(
  current: LobbyStateContext,
  newState: LobbyState,
  triggeredBy: UserRole,
  context?: Partial<LobbyStateContext>
): LobbyStateContext
```

**Behavior:**
- Validates the transition is allowed
- Checks if the user's role can trigger this transition
- Requires appropriate context (e.g., `sessionId` for `ACTIVE`)
- Throws error if unauthorized or invalid

**Example:**
```typescript
const activeLobby = transitionLobbyState(
  { state: 'READY', lobbyId: 'lobby1', memberCount: 4, dmId: 'dm1', sessionId: null },
  LobbyState.ACTIVE,
  UserRole.DM,
  { sessionId: 'session1' }
);
// Result: { state: 'ACTIVE', lobbyId: 'lobby1', memberCount: 4, dmId: 'dm1', sessionId: 'session1' }

// This would throw:
transitionLobbyState(readyLobby, LobbyState.ACTIVE, UserRole.PLAYER, { sessionId: 'session1' });
// Error: "User with role PLAYER cannot trigger transition: READY -> ACTIVE"
```

### transitionSessionState

```typescript
transitionSessionState(
  current: SessionStateContext,
  newState: SessionState,
  triggeredBy: UserRole
): SessionStateContext
```

**Behavior:**
- Validates the transition is allowed
- Checks if the user's role can trigger this transition (DM-only)
- Throws error if unauthorized or invalid

---

## Enforced Invariants

### ✅ Success Criteria Met

The following are **impossible** in code:

1. **Cannot enter session before it starts**
   ```typescript
   // This will throw an error:
   transitionUserState(
     { state: 'AUTHENTICATED', userId: 'user1', lobbyId: null, sessionId: null },
     UserState.IN_SESSION,
     { userId: 'user1', lobbyId: 'lobby1', sessionId: 'session1', role: UserRole.PLAYER }
   );
   // Error: "User must be IN_LOBBY before entering IN_SESSION"
   ```

2. **Cannot be in multiple states simultaneously**
   - TypeScript discriminated unions enforce this at compile time
   - A `UserStateContext` can only have ONE valid state value
   - Each state has specific required/forbidden fields

3. **Cannot have invalid state combinations**
   ```typescript
   // This is a TypeScript compile error:
   const invalid: UserStateContext = {
     state: 'AUTHENTICATED',
     userId: 'user1',
     sessionId: 'session1', // ERROR: sessionId must be null for AUTHENTICATED
     lobbyId: null,
   };
   ```

4. **Players cannot control session lifecycle**
   ```typescript
   // This will throw an error:
   transitionSessionState(
     { state: 'IN_PROGRESS', sessionId: 'session1', lobbyId: 'lobby1' },
     SessionState.PAUSED,
     UserRole.PLAYER
   );
   // Error: "User with role PLAYER cannot trigger transition: IN_PROGRESS -> PAUSED"
   ```

---

## Usage Examples

### Complete User Journey

```typescript
// 1. User logs in
let userState: UserStateContext = {
  state: UserState.UNAUTHENTICATED,
  userId: null,
  lobbyId: null,
  sessionId: null,
};

userState = transitionUserState(userState, UserState.AUTHENTICATED, {
  userId: 'user123',
});

// 2. User joins a lobby
userState = transitionUserState(userState, UserState.IN_LOBBY, {
  userId: 'user123',
  lobbyId: 'lobby456',
  role: UserRole.PLAYER,
});

// 3. DM starts the session (lobby state changes)
let lobbyState: LobbyStateContext = {
  state: LobbyState.READY,
  lobbyId: 'lobby456',
  memberCount: 4,
  dmId: 'dm789',
  sessionId: null,
};

lobbyState = transitionLobbyState(
  lobbyState,
  LobbyState.ACTIVE,
  UserRole.DM,
  { sessionId: 'session999' }
);

// 4. User enters the session
userState = transitionUserState(userState, UserState.IN_SESSION, {
  userId: 'user123',
  lobbyId: 'lobby456',
  sessionId: 'session999',
  role: UserRole.PLAYER,
});

// 5. Session ends, user returns to authenticated state
userState = transitionUserState(userState, UserState.AUTHENTICATED, {
  userId: 'user123',
});
```

---

## Integration Notes

### Frontend Integration

The state model should be integrated with React Context or state management:

```typescript
// Example: UserContext
const [userState, setUserState] = useState<UserStateContext>({
  state: UserState.UNAUTHENTICATED,
  userId: null,
  lobbyId: null,
  sessionId: null,
});

// When user logs in:
const handleLogin = (userId: string) => {
  const newState = transitionUserState(userState, UserState.AUTHENTICATED, { userId });
  setUserState(newState);
};
```

### Backend Integration

The backend should validate all state transitions before persisting:

```typescript
// Example: API endpoint
app.post('/api/lobby/:lobbyId/start', (req, res) => {
  const { lobbyId } = req.params;
  const { userId, role } = req.user;
  
  const currentLobby = getLobbyFromDB(lobbyId);
  
  try {
    const newLobby = transitionLobbyState(
      currentLobby,
      LobbyState.ACTIVE,
      role,
      { sessionId: generateSessionId() }
    );
    
    saveLobbyToDB(newLobby);
    res.json({ success: true, lobby: newLobby });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

## Testing

Run the test suite to verify state model behavior:

```bash
npx tsx src/models/GameState.test.ts
```

The test suite validates:
- ✓ All valid transitions are allowed
- ✓ All invalid transitions are rejected
- ✓ Role-based permissions are enforced
- ✓ Type safety prevents impossible states
- ✓ Users cannot skip states (e.g., AUTHENTICATED → IN_SESSION)

---

## Future Considerations

This state model is designed to be extended. Potential additions:

1. **Spectator Role**: Users who can watch but not participate
2. **Lobby Invitations**: Pending state for invited users
3. **Session Reconnection**: Handling disconnects and rejoins
4. **Multi-Session Support**: Users in multiple lobbies simultaneously

Any extensions should maintain the core principles:
- Mutual exclusivity of states
- Explicit, validated transitions
- Role-based permissions
- Type safety
