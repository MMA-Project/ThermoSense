import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Response } from "express";

import type { AuthRequest } from "./auth.middleware";
import { createRateLimit } from "./rate-limit.middleware";

function createMockResponse() {
  const state = {
    statusCode: 200,
    body: undefined as unknown,
    headers: new Map<string, string>(),
  };

  const response = {
    setHeader(name: string, value: string) {
      state.headers.set(name, value);
      return this;
    },
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      state.body = payload;
      return this;
    },
  };

  return {
    response: response as unknown as Response,
    state,
  };
}

const parseSecurityLog = (rawLog: string): Record<string, unknown> => {
  return JSON.parse(rawLog) as Record<string, unknown>;
};

const assertSecurityLogShape = (
  payload: Record<string, unknown>,
  expectedEvent: string,
) => {
  assert.equal(typeof payload.timestamp, "string");
  assert.match(payload.timestamp as string, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(payload.level, "warn");
  assert.equal(payload.event, expectedEvent);
  assert.equal(typeof payload.user_or_ip, "string");
  assert.equal(typeof payload.endpoint, "string");
  assert.equal(typeof payload.reason, "string");
  assert.equal(typeof payload.correlation_id, "string");
};

test("Rate limit blocks after threshold and sets Retry-After", () => {
  const middleware = createRateLimit({ windowMs: 60_000, maxRequests: 2 });
  const userId = `rl-user-${Date.now()}-${Math.random()}`;

  const req = {
    user: {
      userId,
      role: "operator",
      scope: ["actuator:write"],
      zoneIds: ["zone_a"],
    },
    ip: "127.0.0.1",
    method: "PATCH",
    originalUrl: "/api/actuator/12",
    correlationId: "3f7f9ef9-bdaa-4f43-8fdb-9a3464f8139f",
  } as AuthRequest;

  const first = createMockResponse();
  const second = createMockResponse();
  const third = createMockResponse();

  let firstNextCalled = false;
  let secondNextCalled = false;
  let thirdNextCalled = false;

  const capturedWarnLogs: string[] = [];
  const originalWarn = console.warn;
  console.warn = (value?: unknown) => {
    capturedWarnLogs.push(String(value));
  };

  try {
    middleware(req, first.response, (() => {
      firstNextCalled = true;
    }) as NextFunction);

    middleware(req, second.response, (() => {
      secondNextCalled = true;
    }) as NextFunction);

    middleware(req, third.response, (() => {
      thirdNextCalled = true;
    }) as NextFunction);
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(firstNextCalled, true);
  assert.equal(secondNextCalled, true);
  assert.equal(thirdNextCalled, false);
  assert.equal(third.state.statusCode, 429);
  assert.equal(third.state.headers.has("Retry-After"), true);
  assert.equal(capturedWarnLogs.length, 1);

  const logPayload = parseSecurityLog(capturedWarnLogs[0]);
  assertSecurityLogShape(logPayload, "rate_limited");
  assert.equal(logPayload.user_or_ip, `user:${userId}`);
  assert.equal(logPayload.endpoint, "PATCH /api/actuator/12");
  assert.match(logPayload.reason as string, /^threshold_exceeded:/);
  assert.equal(
    logPayload.correlation_id,
    "3f7f9ef9-bdaa-4f43-8fdb-9a3464f8139f",
  );
  assert.equal(capturedWarnLogs[0].includes("Bearer"), false);
  assert.equal(capturedWarnLogs[0].includes("password"), false);
  assert.equal(capturedWarnLogs[0].includes("api_key"), false);
});

test("Rate limit counts by user id before IP", () => {
  const middleware = createRateLimit({ windowMs: 60_000, maxRequests: 1 });
  const sharedIp = "10.0.0.5";

  const reqUserA = {
    user: {
      userId: `rl-user-a-${Date.now()}-${Math.random()}`,
      role: "operator",
      scope: ["actuator:write"],
      zoneIds: ["zone_a"],
    },
    ip: sharedIp,
    method: "PATCH",
    originalUrl: "/api/actuator/1",
    correlationId: "8df5f2f4-d9af-4f0a-a10f-bf58f6e95cc7",
  } as AuthRequest;

  const reqUserB = {
    user: {
      userId: `rl-user-b-${Date.now()}-${Math.random()}`,
      role: "operator",
      scope: ["actuator:write"],
      zoneIds: ["zone_a"],
    },
    ip: sharedIp,
    method: "PATCH",
    originalUrl: "/api/actuator/1",
    correlationId: "7b376d38-b8b5-4992-bf34-478ccaf4fd9c",
  } as AuthRequest;

  const firstA = createMockResponse();
  const blockedA = createMockResponse();
  const firstB = createMockResponse();

  let nextA1 = false;
  let nextA2 = false;
  let nextB1 = false;

  const capturedWarnLogs: string[] = [];
  const originalWarn = console.warn;
  console.warn = (value?: unknown) => {
    capturedWarnLogs.push(String(value));
  };

  try {
    middleware(reqUserA, firstA.response, (() => {
      nextA1 = true;
    }) as NextFunction);

    middleware(reqUserA, blockedA.response, (() => {
      nextA2 = true;
    }) as NextFunction);

    middleware(reqUserB, firstB.response, (() => {
      nextB1 = true;
    }) as NextFunction);
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(nextA1, true);
  assert.equal(nextA2, false);
  assert.equal(blockedA.state.statusCode, 429);
  assert.equal(nextB1, true);
  assert.equal(firstB.state.statusCode, 200);
  assert.equal(capturedWarnLogs.length, 1);
});
