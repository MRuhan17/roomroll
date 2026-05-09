export const getCorsOrigins = (): string[] => {
    const envOrigins = process.env.CORS_ORIGIN;
    if (envOrigins) {
        const parsed = envOrigins
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean);
        if (parsed.length > 0) {
            return parsed;
        }
    }
    return ['http://localhost:5173'];
};

export const corsOptions = {
    origin: getCorsOrigins(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
};
