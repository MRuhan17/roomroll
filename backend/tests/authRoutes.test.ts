import request from 'supertest';

jest.mock('../src/config/db', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

jest.mock('bcrypt', () => ({
    __esModule: true,
    default: {
        genSalt: jest.fn(),
        hash: jest.fn(),
        compare: jest.fn(),
    },
}));

jest.mock('jsonwebtoken', () => ({
    __esModule: true,
    default: {
        sign: jest.fn(),
        verify: jest.fn(),
    },
}));

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { supabase } from '../src/config/db';
import { createInsertSelectBuilder, createSelectBuilder } from './helpers/supabaseMock';

describe('auth routes', () => {
    const supabaseFromMock = supabase.from as jest.Mock;
    const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;
    const jwtMock = jwt as jest.Mocked<typeof jwt>;

    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret';
    });

    it('registers a user and returns a token', async () => {
        supabaseFromMock
            .mockImplementationOnce(() => createSelectBuilder({ data: [], error: null }))
            .mockImplementationOnce(() =>
                createInsertSelectBuilder({
                    data: [{ id: 7, display_name: 'Ranger', email: 'ranger@example.com' }],
                    error: null,
                })
            );

        bcryptMock.genSalt.mockResolvedValue('salt' as never);
        bcryptMock.hash.mockResolvedValue('hashed-password' as never);
        jwtMock.sign.mockReturnValue('signed-jwt' as never);

        const response = await request(app).post('/api/auth/register').send({
            displayName: ' Ranger ',
            email: 'RANGER@EXAMPLE.COM',
            password: 'secret123',
        });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            user: {
                id: 7,
                displayName: 'Ranger',
                email: 'ranger@example.com',
            },
            token: 'signed-jwt',
        });
        expect(jwtMock.sign).toHaveBeenCalledWith(
            { id: 7, email: 'ranger@example.com' },
            'test-secret',
            { expiresIn: '24h' }
        );
    });

    it('rejects incomplete registration payloads', async () => {
        const response = await request(app).post('/api/auth/register').send({
            email: 'mage@example.com',
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: 'Display name, email, and password are required',
        });
        expect(supabaseFromMock).not.toHaveBeenCalled();
    });

    it('logs in an existing user', async () => {
        supabaseFromMock.mockImplementationOnce(() =>
            createSelectBuilder({
                data: [
                    {
                        id: 9,
                        display_name: 'Cleric',
                        email: 'cleric@example.com',
                        password_hash: 'stored-hash',
                    },
                ],
                error: null,
            })
        );

        bcryptMock.compare.mockResolvedValue(true as never);
        jwtMock.sign.mockReturnValue('login-jwt' as never);

        const response = await request(app).post('/api/auth/login').send({
            email: 'cleric@example.com',
            password: 'secret123',
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            user: {
                id: 9,
                displayName: 'Cleric',
                email: 'cleric@example.com',
            },
            token: 'login-jwt',
        });
        expect(bcryptMock.compare).toHaveBeenCalledWith('secret123', 'stored-hash');
    });

    it('returns invalid credentials for unknown users', async () => {
        supabaseFromMock.mockImplementationOnce(() =>
            createSelectBuilder({
                data: [],
                error: null,
            })
        );

        const response = await request(app).post('/api/auth/login').send({
            email: 'missing@example.com',
            password: 'secret123',
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: 'Invalid credentials',
        });
    });
});
