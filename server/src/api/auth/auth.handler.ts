import { NextFunction, Request, Response } from "express";

export async function signOut(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
        return next(new Error("No session found"));
    }

    try {
        req.session.destroy((err) => {
            if (err) {
                throw new Error("Could not destroy session");
            }
        });

        res.clearCookie("leetwars.sid");
        delete req.user;
        return res.json(null);
    } catch (err) {
        return next(err);
    }
}
