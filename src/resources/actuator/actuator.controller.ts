import type { RequestHandler } from "express";

import { ActuatorRepository } from "./actuator.repository";
import { ActuatorService } from "./actuator.service";

class ActuatorController {
  private readonly actuatorService: ActuatorService;

  constructor() {
    const actuatorRepository = new ActuatorRepository();
    this.actuatorService = new ActuatorService(actuatorRepository);
  }

  patchActuatorById: RequestHandler = async (_req, res) => {
    res.status(501).json({
      message: "TODO: implement PATCH /actuator/:id controller",
    });
  };
}

export { ActuatorController };
