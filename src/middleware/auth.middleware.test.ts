import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Response } from "express";

import type { AuthRequest } from "./auth.middleware";
import { authorize, protect } from "./auth.middleware";
import type { SensorRepository } from "../resources/sensor/sensor.repository";
import { SensorService } from "../resources/sensor/sensor.service";

function createMockResponse() {
  const state = {
    statusCode: 200,
    body: undefined as unknown,
  };

  const response = {
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

test("Auth logs structured security event on missing token (401)", () => {
  const req = {
    method: "GET",
    originalUrl: "/api/auth/me",
    ip: "192.168.1.42",
    correlationId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    headers: {},
  } as AuthRequest;

  const { response, state } = createMockResponse();

  const capturedWarnLogs: string[] = [];
  const originalWarn = console.warn;
  console.warn = (value?: unknown) => {
    capturedWarnLogs.push(String(value));
  };

  let nextCalled = false;
  try {
    protect(req, response, (() => {
      nextCalled = true;
    }) as NextFunction);
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(nextCalled, false);
  assert.equal(state.statusCode, 401);
  assert.equal(capturedWarnLogs.length, 1);

  const logPayload = parseSecurityLog(capturedWarnLogs[0]);
  assertSecurityLogShape(logPayload, "auth_failed");
  assert.equal(logPayload.user_or_ip, "ip:192.168.1.42");
  assert.equal(logPayload.endpoint, "GET /api/auth/me");
  assert.equal(logPayload.reason, "token_missing");
  assert.equal(
    logPayload.correlation_id,
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  );
  assert.equal(capturedWarnLogs[0].includes("Bearer"), false);
  assert.equal(capturedWarnLogs[0].includes("password"), false);
  assert.equal(capturedWarnLogs[0].includes("api_key"), false);
});

test("BFLA adverse: reader role is rejected on restricted DELETE capability", () => {
  const middleware = authorize({
    requiredScope: "sensor:write",
    allowedRoles: ["operator", "admin"],
  });

  const req = {
    user: {
      userId: "u_reader",
      role: "reader",
      scope: ["sensor:write"],
      zoneIds: ["zone_a"],
    },
    method: "DELETE",
    originalUrl: "/api/sensor/12",
    ip: "10.0.0.1",
    correlationId: "7d2f8f6c-95f3-4f7a-b483-0264cd6dbf67",
  } as AuthRequest;

  const { response, state } = createMockResponse();

  const capturedWarnLogs: string[] = [];
  const originalWarn = console.warn;
  console.warn = (value?: unknown) => {
    capturedWarnLogs.push(String(value));
  };

  let nextCalled = false;
  const next = (() => {
    nextCalled = true;
  }) as NextFunction;

  try {
    middleware(req, response, next);
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(nextCalled, false);
  assert.equal(state.statusCode, 403);
  assert.equal(capturedWarnLogs.length, 1);

  const logPayload = parseSecurityLog(capturedWarnLogs[0]);
  assertSecurityLogShape(logPayload, "access_denied");
  assert.equal(logPayload.user_or_ip, "user:u_reader");
  assert.equal(logPayload.endpoint, "DELETE /api/sensor/12");
  assert.match(logPayload.reason as string, /^role_insufficient:/);
  assert.equal(
    logPayload.correlation_id,
    "7d2f8f6c-95f3-4f7a-b483-0264cd6dbf67",
  );
});

test("BFLA nominal: operator role with scope is authorized", () => {
  const middleware = authorize({
    requiredScope: "sensor:write",
    allowedRoles: ["operator", "admin"],
  });

  const req = {
    user: {
      userId: "u_operator",
      role: "operator",
      scope: ["sensor:write"],
      zoneIds: ["zone_a"],
    },
  } as AuthRequest;

  const { response } = createMockResponse();

  let nextCalled = false;
  const next = (() => {
    nextCalled = true;
  }) as NextFunction;

  middleware(req, response, next);

  assert.equal(nextCalled, true);
});

test("BOLA adverse: operator cannot delete a sensor outside authorized zones", async () => {
  let deleteCalls = 0;

  const sensorService = new SensorService({
    findById: async () => ({ id: "sensor_b", zoneId: "zone_b" }),
    deleteById: async () => {
      deleteCalls += 1;
    },
  } as unknown as SensorRepository);

  const result = await sensorService.deleteSensorById("sensor_b", {
    role: "operator",
    zoneIds: ["zone_a"],
  });

  assert.deepEqual(result, { status: "not-found" });
  assert.equal(deleteCalls, 0);
});

test("BOLA nominal: operator can delete a sensor inside authorized zones", async () => {
  let deleteCalls = 0;

  const sensorService = new SensorService({
    findById: async () => ({ id: "sensor_a", zoneId: "zone_a" }),
    deleteById: async () => {
      deleteCalls += 1;
    },
  } as unknown as SensorRepository);

  const result = await sensorService.deleteSensorById("sensor_a", {
    role: "operator",
    zoneIds: ["zone_a"],
  });

  assert.deepEqual(result, { status: "deleted" });
  assert.equal(deleteCalls, 1);
});
