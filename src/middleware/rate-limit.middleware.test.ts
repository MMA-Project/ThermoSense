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
  } as AuthRequest;

  const first = createMockResponse();
  const second = createMockResponse();
  const third = createMockResponse();

  let firstNextCalled = false;
  let secondNextCalled = false;
  let thirdNextCalled = false;

  middleware(req, first.response, (() => {
    firstNextCalled = true;
  }) as NextFunction);

  middleware(req, second.response, (() => {
    secondNextCalled = true;
  }) as NextFunction);

  middleware(req, third.response, (() => {
    thirdNextCalled = true;
  }) as NextFunction);

  assert.equal(firstNextCalled, true);
  assert.equal(secondNextCalled, true);
  assert.equal(thirdNextCalled, false);
  assert.equal(third.state.statusCode, 429);
  assert.equal(third.state.headers.has("Retry-After"), true);
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
  } as AuthRequest;

  const reqUserB = {
    user: {
      userId: `rl-user-b-${Date.now()}-${Math.random()}`,
      role: "operator",
      scope: ["actuator:write"],
      zoneIds: ["zone_a"],
    },
    ip: sharedIp,
  } as AuthRequest;

  const firstA = createMockResponse();
  const blockedA = createMockResponse();
  const firstB = createMockResponse();

  let nextA1 = false;
  let nextA2 = false;
  let nextB1 = false;

  middleware(reqUserA, firstA.response, (() => {
    nextA1 = true;
  }) as NextFunction);

  middleware(reqUserA, blockedA.response, (() => {
    nextA2 = true;
  }) as NextFunction);

  middleware(reqUserB, firstB.response, (() => {
    nextB1 = true;
  }) as NextFunction);

  assert.equal(nextA1, true);
  assert.equal(nextA2, false);
  assert.equal(blockedA.state.statusCode, 429);
  assert.equal(nextB1, true);
  assert.equal(firstB.state.statusCode, 200);
});
