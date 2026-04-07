import type { RequestHandler } from "express";

import { ZoneRepository } from "./zone.repository";
import { ZoneService } from "./zone.service";

class ZoneController {
  private readonly zoneService: ZoneService;

  constructor() {
    const zoneRepository = new ZoneRepository();
    this.zoneService = new ZoneService(zoneRepository);
  }

  createAlertThresholdForZone: RequestHandler = async (_req, res) => {
    res.status(501).json({
      message: "TODO: implement POST /zone/:id/alert-threshold controller",
    });
  };
}

export { ZoneController };
