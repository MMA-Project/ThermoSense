import type { NextFunction, Response } from "express";

import type { AuthRequest } from "./auth.middleware";

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  windowStartMs: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const getRequesterKey = (req: AuthRequest): string => {
  if (req.user?.userId) {
    return `user:${req.user.userId}`;
  }

  return `ip:${req.ip ?? "unknown"}`;
};

export const createRateLimit = ({
  windowMs,
  maxRequests,
}: RateLimitOptions) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const now = Date.now();
    const requesterKey = getRequesterKey(req);
    const entry = rateLimitStore.get(requesterKey);

    if (!entry || now - entry.windowStartMs >= windowMs) {
      rateLimitStore.set(requesterKey, {
        count: 1,
        windowStartMs: now,
      });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((windowMs - (now - entry.windowStartMs)) / 1000),
      );
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({
        message: "Too many requests on this endpoint, try again later",
      });
      return;
    }

    entry.count += 1;
    rateLimitStore.set(requesterKey, entry);
    next();
  };
};
