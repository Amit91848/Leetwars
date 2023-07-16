import { RoomSession } from "../../types/Session";
import redisClient from "../config/redis";

export async function setUserRoomSession(
    userId: string | number,
    room: RoomSession
) {
    await redisClient.set(`userRoomSession:${userId}`, JSON.stringify(room));
}

export async function getUserRoomSession(
    userId: number | string
): Promise<RoomSession | undefined> {
    let roomString = await redisClient.get(`userRoomSession:${userId}`);
    return roomString ? JSON.parse(roomString) : undefined;
}

export async function deleteUserRoomSession(userId: string | number) {
    await redisClient.del(`userRoomSession:${userId}`);
}
