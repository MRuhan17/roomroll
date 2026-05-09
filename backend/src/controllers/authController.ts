import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/db';

export const register = async (req: Request, res: Response) => {
    const { displayName, email, password } = req.body;

    try {
        // Check if user exists
        const { data: userExists, error: checkError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);

        if (checkError) throw checkError;

        if (userExists && userExists.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert user
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
                { display_name: displayName, email, password_hash: passwordHash }
            ])
            .select('id, display_name, email');

        if (insertError) throw insertError;
        if (!newUser || newUser.length === 0) throw new Error('User creation failed');

        // Create token
        const token = jwt.sign(
            { id: newUser[0].id, email: newUser[0].email },
            process.env.JWT_SECRET as string,
            { expiresIn: '24h' }
        );

        res.status(201).json({ user: newUser[0], token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);

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
            process.env.JWT_SECRET as string,
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
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};
