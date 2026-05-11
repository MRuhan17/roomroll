export function createSelectBuilder(result: unknown, eqCount = 1) {
    const builder: {
        select: jest.Mock;
        eq: jest.Mock;
    } = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(),
    };

    for (let index = 0; index < Math.max(eqCount - 1, 0); index += 1) {
        builder.eq.mockImplementationOnce(() => builder);
    }

    builder.eq.mockImplementationOnce(() => Promise.resolve(result));

    return builder;
}

export function createQueryBuilder(
    result: unknown,
    resolveOn: 'insert' | 'eq' | 'single' | 'maybeSingle' | 'limit' | 'order' = 'single',
    eqCount = 1
) {
    const builder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn(),
        limit: jest.fn(),
        single: jest.fn(),
        maybeSingle: jest.fn(),
    };

    let eqCalls = 0;

    builder.insert.mockImplementation(() => (resolveOn === 'insert' ? Promise.resolve(result) : builder));
    builder.eq.mockImplementation(() => {
        eqCalls += 1;
        if (resolveOn === 'eq' && eqCalls >= eqCount) {
            return Promise.resolve(result);
        }
        return builder;
    });
    builder.order.mockImplementation(() => (resolveOn === 'order' ? Promise.resolve(result) : builder));
    builder.limit.mockImplementation(() => (resolveOn === 'limit' ? Promise.resolve(result) : builder));
    builder.single.mockResolvedValue(result);
    builder.maybeSingle.mockResolvedValue(result);

    return builder;
}

export function createInsertSelectBuilder(result: unknown) {
    return {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(result),
    };
}

export function createInsertBuilder(result: unknown) {
    return {
        insert: jest.fn().mockResolvedValue(result),
    };
}

export function createSelectSingleBuilder(result: unknown) {
    return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(result),
        }),
    };
}
