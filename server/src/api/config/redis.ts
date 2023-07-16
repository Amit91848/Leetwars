import { Redis } from "ioredis";

if (!process.env.REDIS_URL) {
    throw new Error("Need a Redis connection URL");
}

const redisClient = new Redis(process.env.REDIS_URL);

export default redisClient;
