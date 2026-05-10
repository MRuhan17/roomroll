type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function serializeValue(value: unknown): unknown {
    if (value instanceof Error) {
        return {
            name: value.name,
            message: value.message,
            stack: value.stack,
        };
    }

    if (Array.isArray(value)) {
        return value.map(serializeValue);
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, nestedValue]) => [key, serializeValue(nestedValue)])
        );
    }

    return value;
}

function writeLog(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'test') {
        return;
    }

    const entry = {
        timestamp: new Date().toISOString(),
        level,
        scope,
        message,
        ...(meta ? { meta: serializeValue(meta) } : {}),
    };

    const output = JSON.stringify(entry);

    switch (level) {
        case 'error':
            console.error(output);
            return;
        case 'warn':
            console.warn(output);
            return;
        default:
            console.log(output);
    }
}

export function createLogger(scope: string) {
    return {
        debug: (message: string, meta?: Record<string, unknown>) => writeLog('debug', scope, message, meta),
        info: (message: string, meta?: Record<string, unknown>) => writeLog('info', scope, message, meta),
        warn: (message: string, meta?: Record<string, unknown>) => writeLog('warn', scope, message, meta),
        error: (message: string, meta?: Record<string, unknown>) => writeLog('error', scope, message, meta),
    };
}
