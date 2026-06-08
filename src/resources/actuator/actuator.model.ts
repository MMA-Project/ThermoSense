import { z } from "zod";

import type { Actuator } from "../../generated/types.gen";

export type ActuatorModel = Actuator;

export const PatchActuatorSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1).optional(),
    zoneId: z.string().min(1).optional(),
    type: z.string().min(1).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    state: z.enum(["open", "closed", "on", "off"]).optional(),
    lastCommandAt: z.string().datetime().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.zoneId !== undefined ||
      data.type !== undefined ||
      data.status !== undefined ||
      data.state !== undefined ||
      data.lastCommandAt !== undefined,
    { message: "At least one actuator field must be provided" },
  );

export type PatchActuator = z.infer<typeof PatchActuatorSchema>;
