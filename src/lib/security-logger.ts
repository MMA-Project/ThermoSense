import type { Request } from "express";
import { randomUUID } from "node:crypto";

export type SecurityLogLevel = "warn" | "error";
export type SecurityEvent = "auth_failed" | "access_denied" | "rate_limited";

interface SecurityLogInput {
  level: SecurityLogLevel;
  event: SecurityEvent;
  req: Request;
  reason: string;
}

type RequestWithCorrelationId = Request & {
  correlationId?: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string): boolean => {
  return uuidPattern.test(value);
};

export const getOrCreateCorrelationId = (req: Request): string => {
  const request = req as RequestWithCorrelationId;
  if (request.correlationId && isUuid(request.correlationId)) {
    return request.correlationId;
  }

  const headerFromMethod =
    typeof req.header === "function"
      ? req.header("x-correlation-id")
      : undefined;
  const rawHeader = req.headers?.["x-correlation-id"];
  const headerFromObject =
    typeof rawHeader === "string"
      ? rawHeader
      : Array.isArray(rawHeader)
        ? rawHeader[0]
        : undefined;
  const headerValue = headerFromMethod ?? headerFromObject;
  if (headerValue && isUuid(headerValue)) {
    request.correlationId = headerValue;
    return headerValue;
  }

  const correlationId = randomUUID();
  request.correlationId = correlationId;
  return correlationId;
};

const getRequesterIdentity = (req: Request): string => {
  const request = req as RequestWithCorrelationId & {
    user?: {
      userId?: string;
    };
  };

  if (request.user?.userId) {
    return `user:${request.user.userId}`;
  }

  return `ip:${req.ip ?? "unknown"}`;
};

const getEndpoint = (req: Request): string => {
  const method = req.method || "UNKNOWN";
  const route = req.originalUrl || req.url || req.path || "/";
  return `${method} ${route}`;
};

export const logSecurityEvent = ({
  level,
  event,
  req,
  reason,
}: SecurityLogInput): void => {
  const securityLog = {
    timestamp: new Date().toISOString(),
    level,
    event,
    user_or_ip: getRequesterIdentity(req),
    endpoint: getEndpoint(req),
    reason,
    correlation_id: getOrCreateCorrelationId(req),
  };

  const serializedLog = JSON.stringify(securityLog);
  if (level === "error") {
    console.error(serializedLog);
    return;
  }

  console.warn(serializedLog);
};
