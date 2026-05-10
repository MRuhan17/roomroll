import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/db';
import { createLogger } from '../lib/logger';

const logger = createLogger('auth-controller');

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    return secret;
}

export const register = async (req: Request, res: Response) => {
    const { displayName, email, password } = req.body;

    if (!isNonEmptyString(displayName) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
        return res.status(400).json({ message: 'Display name, email, and password are required' });
    }

    const normalizedEmail = normalizeEmail(email);

    try {
        const { data: userExists, error: checkError } = await supabase
            .from('users')
            .select('*')
            .eq('email', normalizedEmail);

        if (checkError) throw checkError;

        if (userExists && userExists.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
                { display_name: displayName.trim(), email: normalizedEmail, password_hash: passwordHash }
            ])
            .select('id, display_name, email');

        if (insertError) throw insertError;
        if (!newUser || newUser.length === 0) throw new Error('User creation failed');

        const token = jwt.sign(
            { id: newUser[0].id, email: newUser[0].email },
            getJwtSecret(),
            { expiresIn: '24h' }
        );

        res.status(201).json({
            user: {
                id: newUser[0].id,
                displayName: newUser[0].display_name,
                email: newUser[0].email,
            },
            token,
        });
    } catch (error) {
        logger.error('Registration failed', {
            email: normalizedEmail,
            error,
        });
        res.status(500).json({ message: 'Server error during registration' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = normalizeEmail(email);

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', normalizedEmail);

        if (error) throw error;

        if (!user || user.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user[0].id, email: user[0].email },
            getJwtSecret(),
            { expiresIn: '24h' }
        );

        res.json({
            user: {
                id: user[0].id,
                displayName: user[0].display_name,
                email: user[0].email
            },
            token
        });
    } catch (error) {
        logger.error('Login failed', {
            email: normalizedEmail,
            error,
        });
        res.status(500).json({ message: 'Server error during login' });
    }
};
