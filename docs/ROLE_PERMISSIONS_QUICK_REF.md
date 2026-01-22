# Role-Based Permissions - Quick Reference

## Success Criterion ✅

**Non-DM users cannot trigger DM-only actions even if they manipulate the UI.**

---

## DM-Only Actions

| Action | Function | Description |
|--------|----------|-------------|
| **Session Management** |||
| Start Session | `startSession(userState, lobbyId)` | Starts a new session |
| Pause Session | `pauseSession(userState, sessionId)` | Pauses active session |
| Resume Session | `resumeSession(userState, sessionId)` | Resumes paused session |
| End Session | `endSession(userState, sessionId)` | Ends the session |
| **Player Management** |||
| Kick Player | `kickPlayer(userState, playerId, reason?)` | Removes player from lobby |
| Ban Player | `banPlayer(userState, playerId, reason?)` | Bans player from lobby |
| **Content Management** |||
| Upload Map | `uploadMap(userState, mapFile)` | Uploads map to session |
| **Lobby Management** |||
| Modify Settings | `modifyLobbySettings(userState, settings)` | Changes lobby settings |

---

## API Reference

### Permission Checks

```typescript
// Check if user can perform an action
const result = canPerformAction(userState, PrivilegedAction.START_SESSION);
if (result.allowed) {
  // User has permission
} else {
  console.log(result.reason);        // Why permission was denied
  console.log(result.requiredRole);  // Role needed
  console.log(result.currentRole);   // User's current role
}

// Check if user is DM
if (isDM(userState)) {
  // Show DM controls
}

// Check if user is Player
if (isPlayer(userState)) {
  // Show player controls
}
```

### Guarded Actions

All DM-only actions throw `PermissionDeniedError` if called by non-DM:

```typescript
try {
  const { sessionId } = startSession(userState, lobbyId);
  // Success - session started
} catch (error) {
  if (error instanceof PermissionDeniedError) {
    showToast('Only the DM can start sessions', 'error');
  }
}
```

---

## Usage Pattern

```typescript
import { useGameState } from '../context/GameStateContext';
import { 
  canPerformAction, 
  startSession, 
  PrivilegedAction,
  PermissionDeniedError 
} from '../permissions/RolePermissions';

function MyComponent() {
  const { userState } = useGameState();
  
  // 1. Check permission for UI (disable button)
  const canStart = canPerformAction(
    userState, 
    PrivilegedAction.START_SESSION
  ).allowed;
  
  // 2. Handle action with try/catch
  const handleStart = async () => {
    try {
      const { sessionId } = startSession(userState, lobbyId);
      // Success
    } catch (error) {
      if (error instanceof PermissionDeniedError) {
        showToast(error.reason, 'error');
      }
    }
  };
  
  return (
    <button onClick={handleStart} disabled={!canStart}>
      Start Session
    </button>
  );
}
```

---

## Testing

```bash
# Run permission tests
npx tsx src/permissions/RolePermissions.test.ts

# Type check
npx tsc --noEmit
```

---

## Files

- **Implementation:** `src/permissions/RolePermissions.ts`
- **Tests:** `src/permissions/RolePermissions.test.ts`
- **Documentation:** `docs/ROLE_PERMISSIONS.md`

---

## Security

✅ **Cannot be bypassed:**
- UI manipulation (enabling disabled buttons) → Still blocked
- Direct function calls (browser console) → Still blocked
- State manipulation (changing role in memory) → Backend will reject

✅ **Defense in depth:**
1. UI layer: Buttons disabled
2. Function layer: Permission checks
3. Backend layer: Server validation (TODO)
