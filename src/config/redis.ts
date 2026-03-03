import { createClient } from "redis";
import {env} from "./env";

let redis;

// if (env.redisUrl) {
//   redis = createClient({
//     url: env.redisUrl
//   });
// } else {
  redis = createClient({
    username: env.redisUsername,
    password: env.redisPassword,
    socket: {
      host: env.redisHost || "localhost",
      port: Number(env.redisPort) || 6379
    }
  });
// }

export const redisClient=redis;

redis.on("error", (err) => console.log("Redis Client Error", err));

export const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("Redis connected");
    } catch (error) {
        console.log(error);
    }
};