import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { logSecurityEvent } from "../lib/security-logger";

const jwtSecret = process.env.JWT_SECRET ?? "default-secret-change-me";

export interface AuthRequest extends Request {
  correlationId?: string;
  user?: {
    userId: string;
    role: string;
    scope: string[];
    zoneIds: string[];
  };
}

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    logSecurityEvent({
      level: "warn",
      event: "auth_failed",
      req,
      reason: "token_missing",
    });
    res.status(401).json({ message: "Not authorized, no token" });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string;
      role: string;
      scope: string[];
      zoneIds?: string[];
      aud: string;
      sub: string;
    };
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      scope: decoded.scope,
      zoneIds: decoded.zoneIds ?? [],
    };
    next();
  } catch (error) {
    const reason =
      error instanceof Error && error.name
        ? `token_invalid:${error.name}`
        : "token_invalid";
    logSecurityEvent({
      level: "warn",
      event: "auth_failed",
      req,
      reason,
    });
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export interface AuthorizationRequirements {
  requiredScope: string;
  allowedRoles?: string[];
}

export const authorize = (requirements: string | AuthorizationRequirements) => {
  const requiredScope =
    typeof requirements === "string"
      ? requirements
      : requirements.requiredScope;
  const allowedRoles =
    typeof requirements === "string" ? undefined : requirements.allowedRoles;

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.scope.includes(requiredScope)) {
      logSecurityEvent({
        level: "warn",
        event: "access_denied",
        req,
        reason: `scope_missing:${requiredScope}`,
      });
      res.status(403).json({ message: "Forbidden: insufficient scope" });
      return;
    }

    if (allowedRoles && !allowedRoles.includes(req.user.role)) {
      logSecurityEvent({
        level: "warn",
        event: "access_denied",
        req,
        reason: `role_insufficient:required=${allowedRoles.join("|")}:actual=${req.user.role}`,
      });
      res.status(403).json({ message: "Forbidden: insufficient scope" });
      return;
    }

    next();
  };
};
