import { User as PrismaUser } from "@prisma/client";
import { Session } from "express-session";

export interface PassportProfile {
    id: string;
    provider: string;
}

export interface GithubProfile extends PassportProfile {
    username: string;
    _json?: {
        avatar_url?: string;
    };
}

export interface DiscordProfile extends PassportProfile {
    username: string;
    avatar: string;
}

declare global {
    namespace Express {
        interface User extends PrismaUser {}
    }
}

declare module "http" {
    interface IncomingMessage {
        session: Session & {
            passport: {
                user: PrismaUser;
            };
        };
        sessionID: string;
    }
}
