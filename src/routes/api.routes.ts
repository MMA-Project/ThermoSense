import { Router } from "express";

import { ActuatorController } from "../resources/actuator/actuator.controller";
import { AlertThresholdController } from "../resources/alert-threshold/alert-threshold.controller";
import { MeasurementController } from "../resources/measurement/measurement.controller";
import { SensorController } from "../resources/sensor/sensor.controller";
import { ZoneController } from "../resources/zone/zone.controller";

const apiRouter = Router();

const measurementController = new MeasurementController();
const alertThresholdController = new AlertThresholdController();
const actuatorController = new ActuatorController();
const zoneController = new ZoneController();
const sensorController = new SensorController();

apiRouter.get("/measurement", measurementController.getMeasurementList);
apiRouter.patch(
  "/alert-threshold",
  alertThresholdController.patchAlertThreshold,
);
apiRouter.patch("/actuator/:id", actuatorController.patchActuatorById);
apiRouter.post(
  "/zone/:id/alert-threshold",
  zoneController.createAlertThresholdForZone,
);
apiRouter.delete("/sensor/:id", sensorController.deleteSensorById);

export { apiRouter };
