# RoomRoll: Rooms Documentation

This document outlines the current state of Room management in the RoomRoll backend, including features that are implemented and those that are planned.

## Lifecycle

### Creation
- **Endpoint**: `POST /rooms`
- **Description**: Creates a new room. The system automatically generates a unique 6-character alphanumeric invite code. The user who creates the room is assigned as the host (`host_id`) and is automatically added as a participant.

### Joining
- **Endpoint**: `POST /rooms/join`
- **Description**: Users can join an existing room by providing its unique invite code. The system verifies the code and adds the user to the `room_participants` table, provided they aren't already a participant.

### Leaving
- **Status**: **Planned**
- **Description**: The ability for participants to leave a room (or for a host to close/delete a room) is not currently implemented.

## Ownership
- **Description**: Room ownership is established upon creation. The creator's user ID is stored as `host_id` in the `rooms` table. 

## Invites
- **Description**: Invites are handled via a 6-character uppercase alphanumeric code. It is generated upon room creation and must be shared by the host to allow other users to join.

## Limits
- **Status**: **Planned**
- **Description**: Currently, there are no hard limits enforced on the number of participants that can join a single room. Participant caps are planned for a future update.

## Permissions
- **Description**: Access to room-specific actions (such as fetching room details via `GET /rooms/:id` or generating NPCs via `POST /rooms/:id/npc`) requires the requesting user to be an active participant in that room. Granular host-only permissions for managing the room are currently limited and will be expanded in the future using the existing `host_id` field.
