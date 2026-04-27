import type { RequestHandler } from "express";

import type { AuthRequest } from "../../middleware/auth.middleware";

import { SensorRepository } from "./sensor.repository";
import { SensorService } from "./sensor.service";

class SensorController {
  private readonly sensorService: SensorService;

  constructor() {
    const sensorRepository = new SensorRepository();
    this.sensorService = new SensorService(sensorRepository);
  }

  deleteSensorById: RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.sensorService.deleteSensorById(id, {
      role: authReq.user.role,
      zoneIds: authReq.user.zoneIds,
    });

    if (result.status === "not-found") {
      res.status(404).json({ message: "Sensor not found" });
      return;
    }

    res.status(204).send();
  };
}

export { SensorController };
