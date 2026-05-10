import request from 'supertest';

jest.mock('../src/config/db', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

jest.mock('jsonwebtoken', () => ({
    __esModule: true,
    default: {
        sign: jest.fn(),
        verify: jest.fn((token: string, _secret: string, callback: (error: null, user: { id: number; email: string }) => void) =>
            callback(null, { id: 42, email: 'host@example.com' })
        ),
    },
}));

import jwt from 'jsonwebtoken';
import app from '../src/app';
import { supabase } from '../src/config/db';
import {
    createInsertBuilder,
    createInsertSelectBuilder,
    createSelectBuilder,
    createSelectSingleBuilder,
} from './helpers/supabaseMock';

describe('room routes', () => {
    const supabaseFromMock = supabase.from as jest.Mock;
    const jwtMock = jwt as jest.Mocked<typeof jwt>;
    const authHeader = { Authorization: 'Bearer valid-token' };

    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret';
        jwtMock.verify.mockImplementation(
            ((token: string, _secret: string, callback: (error: null, user: { id: number; email: string }) => void) =>
                callback(null, { id: 42, email: 'host@example.com' })) as never
        );
    });

    it('creates a room and adds the host as a participant', async () => {
        supabaseFromMock
            .mockImplementationOnce(() => createSelectBuilder({ data: [], error: null }))
            .mockImplementationOnce(() =>
                createInsertSelectBuilder({
                    data: [
                        {
                            id: 11,
                            name: 'Friday Campaign',
                            invite_code: 'ABC123',
                            host_id: 42,
                            created_at: '2026-05-10T00:00:00.000Z',
                        },
                    ],
                    error: null,
                })
            )
            .mockImplementationOnce(() => createInsertBuilder({ error: null }));

        const response = await request(app)
            .post('/api/rooms')
            .set(authHeader)
            .send({ name: 'Friday Campaign' });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            id: 11,
            name: 'Friday Campaign',
            code: 'ABC123',
            ownerId: 42,
            createdAt: '2026-05-10T00:00:00.000Z',
        });
    });

    it('joins a room by invite code', async () => {
        supabaseFromMock
            .mockImplementationOnce(() =>
                createSelectBuilder({
                    data: [
                        {
                            id: 11,
                            name: 'Friday Campaign',
                            invite_code: 'ABC123',
                            host_id: 7,
                            created_at: '2026-05-10T00:00:00.000Z',
                        },
                    ],
                    error: null,
                })
            )
            .mockImplementationOnce(() => createSelectBuilder({ data: [], error: null }, 2))
            .mockImplementationOnce(() => createInsertBuilder({ error: null }));

        const response = await request(app)
            .post('/api/rooms/join')
            .set(authHeader)
            .send({ code: 'ABC123' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            id: 11,
            name: 'Friday Campaign',
            code: 'ABC123',
            ownerId: 7,
            createdAt: '2026-05-10T00:00:00.000Z',
        });
    });

    it('lists rooms for the authenticated user', async () => {
        supabaseFromMock.mockImplementationOnce(() =>
            createSelectBuilder({
                data: [
                    {
                        room_id: 11,
                        rooms: {
                            id: 11,
                            name: 'Friday Campaign',
                            invite_code: 'ABC123',
                            host_id: 7,
                            created_at: '2026-05-10T00:00:00.000Z',
                        },
                    },
                ],
                error: null,
            })
        );

        const response = await request(app).get('/api/rooms').set(authHeader);

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                id: 11,
                name: 'Friday Campaign',
                code: 'ABC123',
                ownerId: 7,
                createdAt: '2026-05-10T00:00:00.000Z',
            },
        ]);
    });

    it('returns room details for a participant', async () => {
        supabaseFromMock
            .mockImplementationOnce(() =>
                createSelectBuilder({
                    data: [{ room_id: 11, user_id: 42 }],
                    error: null,
                }, 2)
            )
            .mockImplementationOnce(() =>
                createSelectSingleBuilder({
                    data: {
                        id: 11,
                        name: 'Friday Campaign',
                        invite_code: 'ABC123',
                        host_id: 7,
                        created_at: '2026-05-10T00:00:00.000Z',
                        room_participants: [
                            {
                                users: {
                                    id: 42,
                                    display_name: 'Host',
                                    email: 'host@example.com',
                                },
                            },
                            {
                                users: {
                                    id: 99,
                                    display_name: 'Guest',
                                    email: 'guest@example.com',
                                },
                            },
                        ],
                    },
                    error: null,
                })
            );

        const response = await request(app).get('/api/rooms/11').set(authHeader);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            id: 11,
            name: 'Friday Campaign',
            code: 'ABC123',
            ownerId: 7,
            createdAt: '2026-05-10T00:00:00.000Z',
            participants: [
                {
                    id: 42,
                    displayName: 'Host',
                    email: 'host@example.com',
                },
                {
                    id: 99,
                    displayName: 'Guest',
                    email: 'guest@example.com',
                },
            ],
        });
    });

    it('rejects room requests without a token', async () => {
        const response = await request(app).get('/api/rooms');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            message: 'Authentication token required',
        });
    });
});
