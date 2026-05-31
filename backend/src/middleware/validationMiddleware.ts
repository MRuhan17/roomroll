import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validateBody = (schema: z.ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    message: 'Validation failed',
                    errors: error.issues.map((e: any) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
                return;
            }
            res.status(500).json({ message: 'Internal server error during validation' });
        }
    };
};

export const campaignSchema = z.object({
    name: z.string().min(3, 'Campaign name must be at least 3 characters long').max(100, 'Campaign name must be at most 100 characters long'),
    description: z.string().max(1000, 'Description must be at most 1000 characters long').optional().nullable(),
    system: z.string().max(50).optional().nullable(),
    worldType: z.string().max(100).optional().nullable(),
    playMode: z.enum(['human_dm', 'player_only', 'ai_dm']).optional().nullable(),
    genre: z.string().max(100).optional().nullable(),
    tone: z.string().max(100).optional().nullable(),
    storyFootnotes: z.string().max(5000).optional().nullable(),
    guidance: z.object({
        important_locations: z.string().optional().nullable(),
        forbidden_lore: z.string().optional().nullable(),
        campaign_objectives: z.string().optional().nullable(),
        recurring_villains: z.string().optional().nullable(),
        faction_conflicts: z.string().optional().nullable(),
        emotional_themes: z.string().optional().nullable(),
    }).optional().nullable(),
    targetSessions: z.number().min(1).max(100).optional().nullable(),
    pacingIntensity: z.enum(['auto', 'slow', 'balanced', 'fast']).optional().nullable(),
    criticalArcs: z.array(z.string()).optional().nullable(),
});

export const characterSchema = z.object({
    name: z.string().min(2, 'Character name must be at least 2 characters long').max(100, 'Character name must be at most 100 characters long'),
    class: z.string().max(50).optional().nullable(),
    level: z.number().min(1).max(20).optional().nullable(),
    stats: z.record(z.string(), z.any()).optional().nullable(),
});

export const inviteCodeSchema = z.object({
    inviteCode: z.string().min(1, 'Invite code is required').max(50, 'Invite code is too long'),
});

export const loreSchema = z.object({
    title: z.string().min(2, 'Title must be at least 2 characters').max(200, 'Title is too long'),
    category: z.string().max(100).optional().nullable(),
    content: z.string().min(10, 'Content must be at least 10 characters long'),
    is_secret: z.boolean().optional(),
    is_discovered: z.boolean().optional(),
});

export const worldEventSchema = z.object({
    title: z.string().min(2, 'Title must be at least 2 characters').max(200, 'Title is too long'),
    description: z.string().max(2000).optional().nullable(),
    status: z.string().max(50).optional().nullable(),
});
