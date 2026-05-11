export const getCorsOrigins = (): string[] => {
    const envOrigins = process.env.CORS_ORIGIN || process.env.FRONTEND_URL;
    const allowedOrigins = ['https://roomroll.co.in'];

    if (envOrigins) {
        const parsed = envOrigins
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean);
        allowedOrigins.push(...parsed);
    }

    if (process.env.NODE_ENV !== 'production') {
        allowedOrigins.push('http://localhost:5173');
        allowedOrigins.push('http://localhost:3000');
    }

    // Allow Vercel preview deployments
    return allowedOrigins;
};

export const corsOptions = {
    origin: getCorsOrigins(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
};
