import { IQuestion } from "./Questions";

export interface RoomSession {
    roomId: string;
    questions: IQuestion[];
    userColor: string;
    createdAt: Date;
    duration?: number | null;
    joinedAt: Date;
}

export interface SessionResponse {
    username: string;
    provider: string;
    picture?: string | null;
    room?: RoomSession;
}
