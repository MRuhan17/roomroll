# Permissions Matrix

RoomRoll's permission model strictly controls access to campaigns and entities based on a user's role relative to a specific campaign.

## Roles
- **Dungeon Master (DM)**: The creator and host of a campaign.
- **Player**: A participant invited to the campaign.
- **Non-Member**: An authenticated user who is not a participant in the campaign.

## Route-Level Role Enforcement (Backend API)
The backend enforces permissions primarily at the API controller level. Before executing campaign logic, the controller verifies membership:
1. It queries `campaign_participants` to confirm the user is a member.
2. It checks the `role` property of the participant (`DM` vs `Player`).

### Permission Matrix

| Feature / Action | Non-Member | Player | DM |
| :--- | :---: | :---: | :---: |
| View active campaign (`GET /`) | ❌ | ✅ | ✅ |
| Join campaign via invite code | ✅ | N/A | N/A |
| View campaign snapshot | ❌ | ✅ | ✅ |
| Update campaign metadata | ❌ | ❌ | ✅ |
| Generate/Update Story Prep | ❌ | ❌ | ✅ |
| Manage Tavern / NPCs | ❌ | ❌ | ✅ |
| Chat with Tavern NPCs | ❌ | ❌ | ✅ |
| Detect/Apply Panic & Derailment | ❌ | ❌ | ✅ |
| Rollback Session State | ❌ | ❌ | ✅ |
| Manage Pacing & Arcs | ❌ | ❌ | ✅ |
| View Session Recaps | ❌ | ✅ | ✅ |
| Create/Edit Character | ❌ | ✅ (Own Only) | ✅ (All) |

## Database-Level Row Level Security (RLS)
As a defense-in-depth measure, Row Level Security (RLS) is applied to all tables via the `rls_policies.sql` migration. While the backend accesses the DB via a service role (bypassing RLS), these policies ensure security if client-side or direct DB access is ever introduced.

- **SELECT (Read)**: Players can query rows (campaigns, events, logs, maps, dice rolls, characters) *if and only if* they exist in the `campaign_participants` table for that campaign.
- **INSERT / UPDATE / DELETE (Write)**: Restricted heavily to the `dm_user_id` (the DM). For `characters`, the character owner (`user_id`) or the DM can make modifications.
