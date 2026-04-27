import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Response } from "express";

import type { AuthRequest } from "./auth.middleware";
import { authorize } from "./auth.middleware";
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
  } as AuthRequest;

  const { response, state } = createMockResponse();

  let nextCalled = false;
  const next = (() => {
    nextCalled = true;
  }) as NextFunction;

  middleware(req, response, next);

  assert.equal(nextCalled, false);
  assert.equal(state.statusCode, 403);
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
