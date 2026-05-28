import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 login requests per minute
    message: { message: 'Too many login attempts. Please try again after a minute.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const registerLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // Limit each IP to 3 registrations per minute
    message: { message: 'Too many registration attempts. Please try again after a minute.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 email dispatches per hour
    message: { message: 'Too many email requests. Please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const campaignCreationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 campaigns per minute
    message: { message: 'Too many campaigns created. Please try again after a minute.' },
    standardHeaders: true,
    legacyHeaders: false,
});
