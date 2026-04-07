import type { RequestHandler } from "express";

import { AlertThresholdRepository } from "./alert-threshold.repository";
import { AlertThresholdService } from "./alert-threshold.service";

class AlertThresholdController {
  private readonly alertThresholdService: AlertThresholdService;

  constructor() {
    const alertThresholdRepository = new AlertThresholdRepository();
    this.alertThresholdService = new AlertThresholdService(
      alertThresholdRepository,
    );
  }

  patchAlertThreshold: RequestHandler = async (_req, res) => {
    res.status(501).json({
      message: "TODO: implement PATCH /alert-threshold controller",
    });
  };
}

export { AlertThresholdController };
