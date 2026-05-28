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

    return allowedOrigins;
};

export const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const allowed = getCorsOrigins();
        // Allow same-origin requests (like mobile, curl, supertest, etc. which don't set Origin header)
        if (!origin || allowed.indexOf(origin) !== -1) {
            callback(null, true);
            return;
        }
        
        // Dynamically allow safe roomroll vercel preview deployments
        const isVercelPreview = origin.endsWith('.vercel.app') && origin.includes('roomroll');
        if (isVercelPreview) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
};
