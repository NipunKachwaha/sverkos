import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Determines the allowed number of emails per minute from the environment.
 * Defaults to 20 if not specified.
 */
function getResendRateLimit(): number {
  const fromEnv = process.env.RESEND_PROXY_EMAILS_PER_MINUTE;
  return fromEnv ? parseInt(fromEnv, 10) : 20;
}

/**
 * Token bucket rate limiter for Resend proxy.
 * Allows X requests per minute with a burst capacity of X.
 * Automatically connects to Upstash Redis using UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 */
export const resendRateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.tokenBucket(
    getResendRateLimit(), // Refill rate (e.g., 20 tokens)
    "1 m",                // Interval (per minute)
    getResendRateLimit()  // Maximum capacity (burst limit)
  ),
  analytics: true,
  prefix: "ratelimit:resend", // Helps organize keys in your Redis database
});