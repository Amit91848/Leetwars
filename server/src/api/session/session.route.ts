import { NextFunction, Router, Request, Response } from "express";
import { SessionResponse, RoomSession } from "../../types/Session";
import { getUserRoomSession } from "./session.handler";
import { logger } from "../../logger";

const router = Router();

router.get(
    "/",
    async (
        req: Request,
        res: Response<SessionResponse | null>,
        next: NextFunction
    ) => {
        if (req.isAuthenticated()) {
            let room: RoomSession | undefined;

            try {
                room = await getUserRoomSession(req.user.id);
            } catch (err) {
                return next(err);
            }

            let sessionResponse: SessionResponse = { ...req.user, room };

            return res.json(sessionResponse);
        }
        return res.json(null);
    }
);

export default router;
