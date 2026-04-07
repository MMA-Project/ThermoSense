import type { RequestHandler } from "express";

import { MeasurementRepository } from "./measurement.repository";
import { MeasurementService } from "./measurement.service";

class MeasurementController {
  private readonly measurementService: MeasurementService;

  constructor() {
    const measurementRepository = new MeasurementRepository();
    this.measurementService = new MeasurementService(measurementRepository);
  }

  getMeasurementList: RequestHandler = async (_req, res) => {
    res.status(501).json({
      message: "TODO: implement GET /measurement controller",
    });
  };
}

export { MeasurementController };
