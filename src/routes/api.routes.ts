import { Router } from "express";

import { authorize, protect } from "../middleware/auth.middleware";
import { createRateLimit } from "../middleware/rate-limit.middleware";
import { ActuatorController } from "../resources/actuator/actuator.controller";
import { AlertThresholdController } from "../resources/alert-threshold/alert-threshold.controller";
import { MeasurementController } from "../resources/measurement/measurement.controller";
import { SensorController } from "../resources/sensor/sensor.controller";
import { UserController } from "../resources/user/user.controller";
import { ZoneController } from "../resources/zone/zone.controller";

const apiRouter = Router();

const userController = new UserController();
const measurementController = new MeasurementController();
const alertThresholdController = new AlertThresholdController();
const actuatorController = new ActuatorController();
const zoneController = new ZoneController();
const sensorController = new SensorController();

const actuatorCommandRateLimit = createRateLimit({
  windowMs: 60_000,
  maxRequests: 10,
});

// Auth routes
apiRouter.post("/auth/register", userController.signup);
apiRouter.post("/auth/login", userController.login);
apiRouter.get("/auth/me", protect, userController.me);

// Protected routes
apiRouter.get(
  "/measurement",
  protect,
  authorize("measurement:read"),
  measurementController.getMeasurementList,
);
apiRouter.patch(
  "/alert-threshold",
  protect,
  authorize("alert-threshold:write"),
  alertThresholdController.patchAlertThreshold,
);
apiRouter.patch(
  "/actuator/:id",
  protect,
  actuatorCommandRateLimit,
  authorize("actuator:write"),
  actuatorController.patchActuatorById,
);
apiRouter.post(
  "/zone/:id/alert-threshold",
  protect,
  authorize("alert-threshold:write"),
  zoneController.createAlertThresholdForZone,
);
apiRouter.delete(
  "/sensor/:id",
  protect,
  authorize({
    requiredScope: "sensor:write",
    allowedRoles: ["operator", "admin"],
  }),
  sensorController.deleteSensorById,
);

export { apiRouter };
