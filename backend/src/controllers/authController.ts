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
    const { displayName, email, password, termsAccepted, privacyAccepted } = req.body;

    if (!isNonEmptyString(displayName) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
        return res.status(400).json({ message: 'Display name, email, and password are required' });
    }

    if (!termsAccepted || !privacyAccepted) {
        return res.status(400).json({ message: 'You must accept the Terms of Service and Privacy Policy' });
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
                { 
                    display_name: displayName.trim(), 
                    email: normalizedEmail, 
                    password_hash: passwordHash,
                    terms_accepted_at: new Date().toISOString(),
                    privacy_accepted_at: new Date().toISOString()
                }
            ])
            .select('id, display_name, email');

        if (insertError) throw insertError;
        if (!newUser || newUser.length === 0) throw new Error('User creation failed');

        const token = jwt.sign(
            { 
                id: newUser[0].id, 
                email: newUser[0].email,
                role: 'authenticated',
                sub: String(newUser[0].id)
            },
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
            { 
                id: user[0].id, 
                email: user[0].email,
                role: 'authenticated',
                sub: String(user[0].id)
            },
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

import { AuthRequest } from '../middleware/auth';

export const exportUserData = async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const [
            { data: profile },
            { data: campaigns },
            { data: characters },
            { data: rooms },
            { data: lore },
            { data: preferences }
        ] = await Promise.all([
            supabase.from('users').select('id, display_name, email, terms_accepted_at, privacy_accepted_at, created_at').eq('id', userId).single(),
            supabase.from('campaigns').select('*').eq('dm_user_id', userId),
            supabase.from('characters').select('*').eq('user_id', userId),
            supabase.from('rooms').select('*').eq('host_id', userId),
            supabase.from('lore_events').select('*').eq('discovered_by', userId),
            supabase.from('consent_preferences').select('*').eq('user_id', userId).maybeSingle()
        ]);

        const exportData = {
            profile,
            campaigns: campaigns || [],
            characters: characters || [],
            rooms: rooms || [],
            lore: lore || [],
            preferences: preferences || null,
            exportedAt: new Date().toISOString()
        };

        res.json(exportData);
    } catch (error) {
        logger.error('Data export failed', { userId, error });
        res.status(500).json({ message: 'Server error during data export' });
    }
};

export const deleteAccount = async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { password } = req.body;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!password) {
        return res.status(400).json({ message: 'Password is required to delete account' });
    }

    try {
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('password_hash')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(403).json({ message: 'Incorrect password' });
        }

        const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (deleteError) throw deleteError;

        res.json({ message: 'Account and all associated data deleted successfully' });
    } catch (error) {
        logger.error('Account deletion failed', { userId, error });
        res.status(500).json({ message: 'Server error during account deletion' });
    }
};
