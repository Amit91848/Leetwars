import express, {
    NextFunction,
    Request,
    Response,
    urlencoded,
    json,
} from "express";
import helmet from "helmet";
import http from "http";
import { Redis } from "ioredis";
import cors from "cors";
import { User } from "@prisma/client";
import session from "express-session";
import passport from "passport";
import { Strategy as GithubStrategy } from "passport-github2";
import { Strategy as DiscordStrategy } from "passport-discord";

import prisma from "..";
import { httpLog, logger } from "../logger";
import { DiscordProfile, GithubProfile } from "../types/authProfile";
import { ensureAuthenticated } from "../middleware";

import redisClient from "./config/redis";
import authRoute from "./auth/auth.route";
import sessionRoute from "./session/session.route";
import roomRoute from "./room/room.route";
import submissionRoute from "./submission/submission.route";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import { MessageInterface } from "../types/Message";
import { RoomSession } from "../types/Session";
import { exitRoomFunction } from "./room/room.handler";
import { getUserRoomSession } from "./session/session.handler";

const RedisStore = require("connect-redis").default;
// const DiscordStrategy = require("passport-discord").Strategy;

const app = express();

app.use(helmet());
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);
app.use(urlencoded({ extended: true }));
app.use(json());

if (!process.env.EXPRESS_SESSION_SECRET) {
    throw new Error("Need an express-session secret");
}

app.set("trust proxy", 1);
export const sessionMiddleware = session({
    name: "leetwars.sid",
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 604_800_000, // 7 days
        httpOnly: true,
        sameSite: "none",
        secure: true,
        domain: process.env.COOKIE_DOMAIN || undefined,
    },
    store: new RedisStore({ client: redisClient }),
});
app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new GithubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID || "placeholder",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "placeholder",
            callbackURL: "/auth/github/callback",
        },
        async function (
            accessToken: string,
            refreshToken: string,
            profile: GithubProfile,
            done: any
        ) {
            try {
                let user = await prisma.user.upsert({
                    where: {
                        provider_providerUserId: {
                            provider: profile.provider,
                            providerUserId: profile.id,
                        },
                    },
                    update: {},
                    create: {
                        username: profile.username,
                        picture: profile._json?.avatar_url,
                        provider: profile.provider,
                        providerUserId: profile.id,
                    },
                });
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

passport.use(
    new DiscordStrategy(
        {
            clientID: process.env.DISCORD_CLIENT_ID || "placeholder",
            clientSecret: process.env.DISCORD_CLIENT_SECRET || "placeholder",
            callbackURL: "/auth/discord/callback",
            scope: "identify",
        },
        async function (
            accessToken: string,
            refreshToken: string,
            profile: DiscordProfile,
            done: any
        ) {
            try {
                let user = await prisma.user.upsert({
                    where: {
                        provider_providerUserId: {
                            provider: profile.provider,
                            providerUserId: profile.id,
                        },
                    },
                    update: {},
                    create: {
                        username: profile.username,
                        provider: profile.provider,
                        providerUserId: profile.id,
                        picture:
                            profile.id && profile.avatar
                                ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}`
                                : null,
                    },
                });

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user: User, done) => {
    done(null, user);
});

app.get("/", (req, res) => {
    return res.json({
        message: "Leetwars api",
    });
});

// app.use(httpLog);
app.use("/auth", authRoute);
app.use("/rooms", ensureAuthenticated, roomRoute);
app.use("/submissions", ensureAuthenticated, submissionRoute);
app.use("/sessions", sessionRoute);

app.use("/sign-in-success", (_, res) => {
    res.json({ message: "You have successfully logged in" });
});

app.use("/sign-in-failure", (_, res) => {
    res.json({ message: "There was an error while loggin you in" });
});

const server = http.createServer(app);

export const io = new Server(server, {
    serveClient: false,
    transports: ["websocket", "polling"],
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    },
});

const CLOSED_WINDOW_CACHE_EXPIRATION = 180; // 3 minutes (in sec)
const CLOSED_WINDOW_TIMEOUT = 120_000; // 2 minutes (in ms)
const IDLE_WINDOW_TIMEOUT = 5_400_000; // 90 minutes (in ms)

instrument(io, {
    auth: false,
    mode: "development",
});

io.use((socket, next) => {
    sessionMiddleware(
        socket.request as Request,
        {} as Response,
        next as NextFunction
    );
});

io.use((socket, next) => {
    if (socket.request.session.passport.user) {
        return next();
    } else {
        logger.error({
            message: `Unauthenticated user attempting to connect with socket`,
            socket: socket,
        });
    }
});

io.on("connection", async (socket) => {
    socket.use((_, next) => {
        socket.request.session.reload((err) => {
            if (err) return socket.disconnect();
            else return next();
        });
    });

    if (!socket.request.session.passport.user) {
        logger.error("Cannot connect without user and room session");
        return;
    }

    let room: RoomSession | undefined;

    try {
        room = await getUserRoomSession(
            socket.request.session.passport.user.id
        );
    } catch (err) {
        logger.error("Could not find a room session for the user");
        return;
    }

    if (!room) {
        logger.error("Cannot connect without a room session");
        return;
    }

    if (!socket.request.session.passport.user) {
        logger.error("Cannot connect without user session and room sesssion");
        return;
    }

    const userId = socket.request.session.passport.user.id;

    try {
        let closedWindowTimer = await redisClient.get(
            `closedWindowTimer:${userId}`
        );

        if (closedWindowTimer) {
            clearTimeout(parseInt(closedWindowTimer, 10));
        }
        try {
            await redisClient.del(`closedWindowTimer:${userId}`);
        } catch (error) {
            logger.error(error);
        }
    } catch (err) {
        logger.error(
            `Failed to fetch closedWindowTimer record for user id ${userId}`
        );
    }

    socket.join([`${userId}`, room.roomId]);

    async function idleWindowTimerFunction() {
        try {
            await exitRoomFunction(socket.request as Request);
        } catch (err) {
            logger.warn("Tried to disconnect multiple idle windows at once");
        }
    }

    let idleWindowTimer = setTimeout(
        idleWindowTimerFunction,
        IDLE_WINDOW_TIMEOUT
    );

    socket.on("chat-message", async (message: MessageInterface) => {
        console.log("received socket message");
        if (!room) return;
        io.to(`userId`).emit("keep-alive", "keep-alive-message-server");
        io.to(room.roomId).emit("chat-message", message);
    });

    socket.on("keep-alive", () => {
        clearInterval(idleWindowTimer);
        idleWindowTimer = setTimeout(
            idleWindowTimerFunction,
            IDLE_WINDOW_TIMEOUT
        );
    });
});

export default server;
