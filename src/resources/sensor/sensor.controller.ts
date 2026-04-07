import type { RequestHandler } from "express";

import { SensorRepository } from "./sensor.repository";
import { SensorService } from "./sensor.service";

class SensorController {
  private readonly sensorService: SensorService;

  constructor() {
    const sensorRepository = new SensorRepository();
    this.sensorService = new SensorService(sensorRepository);
  }

  deleteSensorById: RequestHandler = async (_req, res) => {
    res.status(501).json({
      message: "TODO: implement DELETE /sensor/:id controller",
    });
  };
}

export { SensorController };
