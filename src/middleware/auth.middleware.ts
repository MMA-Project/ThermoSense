import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET ?? "default-secret-change-me";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    scope: string[];
  };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; role: string; scope: string[],aud:string,sub:string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export const authorize = (requiredScope: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.scope.includes(requiredScope)) {
      res.status(403).json({ message: "Forbidden: insufficient scope" });
      return;
    }
    next();
  };
};
