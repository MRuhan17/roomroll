import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/db';
import { broadcastRoomState, roomStates } from '../realtime/roomState';
import OpenAI from 'openai';
import { createLogger } from '../lib/logger';

const logger = createLogger('room-controller');

interface RoomRow {
    id: number;
    name: string;
    invite_code: string;
    host_id: number;
    created_at: string;
}

interface ParticipantUserRow {
    id: number;
    display_name: string;
    email: string;
}

let openaiClient: OpenAI | null = null;

const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function getAuthenticatedUserId(req: AuthRequest) {
    return req.user?.id;
}

function getUniqueArrayValue<T>(value: T | T[] | null | undefined) {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }

    return value ?? null;
}

function toRoomResponse(room: RoomRow) {
    return {
        id: room.id,
        name: room.name,
        code: room.invite_code,
        ownerId: room.host_id,
        createdAt: room.created_at,
    };
}

async function createUniqueInviteCode() {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const inviteCode = generateInviteCode();
        const { data: existingRoom, error } = await supabase
            .from('rooms')
            .select('id')
            .eq('invite_code', inviteCode);

        if (error) {
            throw error;
        }

        if (!existingRoom || existingRoom.length === 0) {
            return inviteCode;
        }
    }

    throw new Error('Could not generate a unique invite code');
}

async function isParticipant(roomId: number | string, userId: number) {
    const { data, error } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', userId);

    if (error) {
        throw error;
    }

    return Boolean(data && data.length > 0);
}

function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return null;
    }

    if (!openaiClient) {
        openaiClient = new OpenAI({ apiKey });
    }

    return openaiClient;
}

export const createRoom = async (req: AuthRequest, res: Response) => {
    const { name } = req.body;
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
        return res.status(401).json({ message: 'Authenticated user not found' });
    }

    if (!isNonEmptyString(name)) {
        return res.status(400).json({ message: 'Room name is required' });
    }

    try {
        const inviteCode = await createUniqueInviteCode();
        const { data: newRoom, error: roomError } = await supabase
            .from('rooms')
            .insert([
                { name: name.trim(), invite_code: inviteCode, host_id: userId }
            ])
            .select('id, name, invite_code, host_id, created_at');

        if (roomError) throw roomError;
        if (!newRoom || newRoom.length === 0) throw new Error('Room creation failed');

        const roomId = newRoom[0].id;

        // Add host as a participant
        const { error: participantError } = await supabase
            .from('room_participants')
            .insert([
                { room_id: roomId, user_id: userId }
            ]);

        if (participantError) throw participantError;

        res.status(201).json(toRoomResponse(newRoom[0] as RoomRow));
    } catch (error) {
        logger.error('Room creation failed', {
            userId,
            roomName: isNonEmptyString(name) ? name.trim() : undefined,
            error,
        });
        res.status(500).json({ message: 'Server error during room creation' });
    }
};

export const joinRoom = async (req: AuthRequest, res: Response) => {
    const { code } = req.body;
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
        return res.status(401).json({ message: 'Authenticated user not found' });
    }

    if (!isNonEmptyString(code)) {
        return res.status(400).json({ message: 'Invite code is required' });
    }

    try {
        const { data: room, error: findError } = await supabase
            .from('rooms')
            .select('id, name, invite_code, host_id, created_at')
            .eq('invite_code', code.trim());

        if (findError) throw findError;

        if (!room || room.length === 0) {
            return res.status(404).json({ message: 'Invalid room invite code' });
        }

        const roomId = room[0].id;

        const { data: existingParticipant, error: participantCheckError } = await supabase
            .from('room_participants')
            .select('*')
            .eq('room_id', roomId)
            .eq('user_id', userId);

        if (participantCheckError) throw participantCheckError;

        if (existingParticipant && existingParticipant.length > 0) {
            return res.status(400).json({ message: 'You have already joined this room' });
        }

        // Add user to participants
        const { error: joinError } = await supabase
            .from('room_participants')
            .insert([
                { room_id: roomId, user_id: userId }
            ]);

        if (joinError) throw joinError;

        res.status(200).json(toRoomResponse(room[0] as RoomRow));
    } catch (error) {
        logger.error('Room join failed', {
            userId,
            inviteCode: isNonEmptyString(code) ? code.trim() : undefined,
            error,
        });
        res.status(500).json({ message: 'Server error during room join' });
    }
};

export const fetchRooms = async (req: AuthRequest, res: Response) => {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
        return res.status(401).json({ message: 'Authenticated user not found' });
    }

    try {
        const { data: participants, error: fetchError } = await supabase
            .from('room_participants')
            .select(`
                room_id,
                rooms (
                    id,
                    name,
                    invite_code,
                    host_id,
                    created_at
                )
            `)
            .eq('user_id', userId);

        if (fetchError) throw fetchError;

        const rooms = (participants || [])
            .map((participant) => getUniqueArrayValue((participant as { rooms?: RoomRow | RoomRow[] | null }).rooms))
            .filter((room): room is RoomRow => Boolean(room))
            .map(toRoomResponse);

        res.status(200).json(rooms);
    } catch (error) {
        logger.error('Fetch rooms failed', {
            userId,
            error,
        });
        res.status(500).json({ message: 'Server error while fetching rooms' });
    }
};

export const fetchRoomDetails = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = getAuthenticatedUserId(req);
    const roomId = Array.isArray(id) ? id[0] : id;

    if (!userId) {
        return res.status(401).json({ message: 'Authenticated user not found' });
    }

    try {
        if (!(await isParticipant(roomId, userId))) {
            return res.status(403).json({ message: 'You are not a participant in this room' });
        }

        const { data: roomData, error: roomError } = await supabase
            .from('rooms')
            .select(`
                id,
                name,
                invite_code,
                host_id,
                created_at,
                room_participants (
                    users (
                        id,
                        display_name,
                        email
                    )
                )
            `)
            .eq('id', roomId)
            .single();

        if (roomError) throw roomError;
        
        if (!roomData) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const roomInfo = {
            ...toRoomResponse(roomData as RoomRow),
            participants: (roomData.room_participants || []).map((p: any) => {
                const user = getUniqueArrayValue<ParticipantUserRow>(p.users);
                if (!user) {
                    return null;
                }
                return {
                    id: user.id,
                    displayName: user.display_name,
                    email: user.email
                };
            }).filter((participant): participant is { id: number; displayName: string; email: string } => Boolean(participant))
        };

        res.status(200).json(roomInfo);
    } catch (error) {
        logger.error('Fetch room details failed', {
            userId,
            roomId,
            error,
        });
        res.status(500).json({ message: 'Server error while fetching room details' });
    }
};

export const generateNPC = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { theme } = req.body;
    const userId = getAuthenticatedUserId(req);
    const roomId = Array.isArray(id) ? id[0] : id;

    if (!userId) {
        return res.status(401).json({ message: 'Authenticated user not found' });
    }

    try {
        if (!(await isParticipant(roomId, userId))) {
            return res.status(403).json({ message: 'You are not a participant in this room' });
        }

        const currentState = roomStates.get(roomId);
        if (!currentState) {
            return res.status(400).json({ message: 'Room is not currently active in memory' });
        }

        const client = getOpenAIClient();
        if (!client) {
            return res.status(503).json({ message: 'NPC generation is unavailable until OPENAI_API_KEY is configured' });
        }

        const promptTheme = isNonEmptyString(theme) ? theme.trim() : 'a random fantasy character';
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are an expert dungeon master. Generate a DnD NPC. Provide a JSON response with exactly these fields: name (string), description (a short evocative 1-2 sentence description), hp (integer between 10 and 100), ac (integer between 10 and 20)." },
                { role: "user", content: `Generate an NPC based on the theme: ${promptTheme}` }
            ],
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No response from OpenAI");
        const generatedData = JSON.parse(content);

        const newNpc = {
            id: Math.random().toString(36).substring(7),
            name: generatedData.name,
            description: generatedData.description,
            hp: generatedData.hp,
            ac: generatedData.ac,
            x: Math.random() * 200 + 50,
            y: Math.random() * 200 + 50,
        };

        currentState.npcs.push(newNpc);
        currentState.lastAction = `NPC ${newNpc.name} appeared!`;
        currentState.updatedAt = Date.now();

        broadcastRoomState(roomId);

        res.status(201).json(newNpc);
    } catch (error) {
        logger.error('NPC generation failed', {
            userId,
            roomId,
            theme: isNonEmptyString(theme) ? theme.trim() : undefined,
            error,
        });
        res.status(500).json({ message: 'Server error during NPC generation' });
    }
};
