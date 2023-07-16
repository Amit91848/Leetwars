import { Request, Response, Router } from "express";
import passport from "passport";
import * as AuthHandler from "./auth.handler";
import prisma from "../..";
import { SessionResponse } from "../../types/Session";
import { getUserRoomSession } from "../session/session.handler";

const router = Router();

const FAILURE_REDIRECT_URL = process.env.FAILURE_REDIRECT_URL;
const SUCCESS_REDIRECT_URL = process.env.SUCCESS_REDIRECT_URL;

router.get("/github", passport.authenticate("github"));
router.get(
    "/github/callback",
    passport.authenticate("github", {
        failureRedirect: FAILURE_REDIRECT_URL,
        successRedirect: SUCCESS_REDIRECT_URL,
    })
);

router.get("/google", passport.authenticate("google"));
router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: FAILURE_REDIRECT_URL,
        successRedirect: SUCCESS_REDIRECT_URL,
    })
);

router.get("/discord", passport.authenticate("discord"));
router.get(
    "/discord/callback",
    passport.authenticate("discord", {
        failureRedirect: FAILURE_REDIRECT_URL,
        successRedirect: SUCCESS_REDIRECT_URL,
    })
);

router.get(
    "/hidden",
    async (_: Request, res: Response<SessionResponse | null>) => {
        const user = await prisma.user.findUnique({
            where: {
                id: 0,
            },
        });

        const room = await getUserRoomSession(user?.id || 0);

        if (user) {
            return res.json({
                room,
                provider: user.provider,
                username: user.username,
                picture: user.picture,
            });
        } else {
            res.json(null);
        }
    }
);

router.delete("/signout", AuthHandler.signOut);

export default router;
