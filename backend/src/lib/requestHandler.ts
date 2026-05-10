import { NextFunction, Request, RequestHandler, Response } from 'express';

export type TypedRequestHandler<TRequest extends Request = Request> = (
    req: TRequest,
    res: Response,
    next: NextFunction
) => Promise<unknown> | unknown;

export function toRequestHandler<TRequest extends Request = Request>(
    handler: TypedRequestHandler<TRequest>
): RequestHandler {
    return (req, res, next) => {
        void Promise.resolve(handler(req as TRequest, res, next)).catch(next);
    };
}
