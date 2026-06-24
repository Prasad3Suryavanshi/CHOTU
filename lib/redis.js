import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const TTL_SECONDS = 300;

export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
});