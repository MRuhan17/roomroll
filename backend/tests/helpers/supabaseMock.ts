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
