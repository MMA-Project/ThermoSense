import type { RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import type { AuthRequest } from "../../middleware/auth.middleware";

import { PatchActuatorSchema } from "./actuator.model";
import { ActuatorRepository } from "./actuator.repository";
import { ActuatorService } from "./actuator.service";

class ActuatorController {
  private readonly actuatorService: ActuatorService;

  constructor() {
    const actuatorRepository = new ActuatorRepository();
    this.actuatorService = new ActuatorService(actuatorRepository);
  }

  patchActuatorById: RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      res.status(400).json({ message: "Actuator id is required" });
      return;
    }

    try {
      const validatedData = PatchActuatorSchema.parse(req.body);
      const result = await this.actuatorService.patchActuatorById(
        id,
        validatedData,
        {
          role: authReq.user.role,
          zoneIds: authReq.user.zoneIds,
        },
      );

      if (result.status === "not-found") {
        res.status(404).json({ message: "Actuator not found" });
        return;
      }

      res.status(200).json(result.actuator);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.message });
        return;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        res.status(400).json({ message: "Invalid actuator zoneId" });
        return;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        res.status(404).json({ message: "Actuator not found" });
        return;
      }

      if (error instanceof Error && error.message.includes("id must match")) {
        res.status(400).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: "An unexpected error occurred" });
    }
  };
}

export { ActuatorController };
