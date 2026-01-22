# Kick and Ban System - Quick Reference

## Success Criterion ✅

**A banned player can never join any lobby hosted by that DM.**

---

## Kick vs Ban

| Feature | Kick | Ban |
|---------|------|-----|
| **Scope** | Lobby-specific | DM-scoped (ALL lobbies) |
| **Duration** | Temporary | Permanent |
| **Can Rejoin** | Yes (after cleared) | No |
| **Other Lobbies** | Can join | Cannot join ANY by that DM |
| **Persists After Disband** | No | Yes |

---

## API Quick Reference

### Kick a Player
```typescript
kickPlayerFromLobby(playerId, lobbyId, dmId, reason?)
```
- Removes player from THIS lobby
- Player can join OTHER lobbies by same DM
- Can be cleared with `allowRejoin()`

### Ban a Player
```typescript
banPlayerByDM(playerId, dmId, currentLobbyId?, reason?)
```
- Removes player from current lobby
- Blocks from ALL lobbies by this DM (current + future)
- Cannot be undone (no unban logic)

### Check if Can Join
```typescript
const result = canJoinLobby(playerId, lobbyId, dmId);
if (!result.allowed) {
  console.log(result.reason);  // 'kicked' or 'banned'
  console.log(result.message); // User-friendly message
}
```

### Get Moderation Status
```typescript
const status = getModerationStatus(playerId, lobbyId, dmId);
// Returns: { isKicked, isBanned, canJoin }
```

---

## Integration with Permissions

```typescript
import { kickPlayer, banPlayer } from '../permissions/RolePermissions';

// Kick (DM only)
kickPlayer(userState, lobbyId, playerId, 'reason');

// Ban (DM only)
banPlayer(userState, lobbyId, playerId, 'reason');
```

Both functions:
- ✅ Require DM role (enforced by `guardAction`)
- ✅ Throw `PermissionDeniedError` if unauthorized
- ✅ Trigger immediate removal from lobby

---

## Behavioral Examples

### Kick Example
```
DM kicks Player1 from Lobby A
  ❌ Player1 cannot rejoin Lobby A
  ✅ Player1 can join Lobby B (same DM)
  ✅ Player1 can join Lobby C (different DM)

DM calls allowRejoin(Player1, Lobby A)
  ✅ Player1 can now rejoin Lobby A
```

### Ban Example
```
DM1 bans Player2
  ❌ Player2 cannot join Lobby A (by DM1)
  ❌ Player2 cannot join Lobby B (by DM1)
  ❌ Player2 cannot join future Lobby C (by DM1)
  ✅ Player2 can join Lobby D (by DM2)

Lobby A is disbanded
  ❌ Ban persists
  ❌ Player2 still cannot join new Lobby E (by DM1)
```

---

## Testing

```bash
# Run kick/ban tests
npx tsx src/moderation/KickBanSystem.test.ts

# Type check
npx tsc --noEmit
```

---

## Files

- **Implementation:** `src/moderation/KickBanSystem.ts`
- **Tests:** `src/moderation/KickBanSystem.test.ts`
- **Integration:** `src/permissions/RolePermissions.ts`
- **Documentation:** `docs/KICK_BAN_SYSTEM.md`
