import { NextFunction, Request, Response } from "express";

export function ensureAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (req.isAuthenticated()) return next();
    res.status(401);
    return next(new Error("Unauthenticated Request"));
}
