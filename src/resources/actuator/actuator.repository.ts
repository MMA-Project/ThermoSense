import { prisma } from "../../lib/prisma";

import type { ActuatorModel, PatchActuator } from "./actuator.model";

type ActuatorRecord = NonNullable<
  Awaited<ReturnType<typeof prisma.actuator.findUnique>>
>;

class ActuatorRepository {
  async findById(id: string): Promise<ActuatorModel | null> {
    const actuator = await prisma.actuator.findUnique({
      where: { id },
    });

    return actuator ? this.toModel(actuator) : null;
  }

  async updateById(
    id: string,
    actuatorPatch: PatchActuator,
  ): Promise<ActuatorModel> {
    const actuator = await prisma.actuator.update({
      where: { id },
      data: {
        name: actuatorPatch.name,
        zoneId: actuatorPatch.zoneId,
        type: actuatorPatch.type,
        status: actuatorPatch.status,
        state: actuatorPatch.state,
        lastCommandAt: actuatorPatch.lastCommandAt
          ? new Date(actuatorPatch.lastCommandAt)
          : undefined,
      },
    });

    return this.toModel(actuator);
  }

  private toModel(actuator: ActuatorRecord): ActuatorModel {
    return {
      id: actuator.id,
      name: actuator.name,
      zoneId: actuator.zoneId,
      type: actuator.type,
      status: actuator.status ?? undefined,
      state: actuator.state,
      lastCommandAt: actuator.lastCommandAt?.toISOString(),
      createdAt: actuator.createdAt.toISOString(),
      updatedAt: actuator.updatedAt.toISOString(),
    };
  }
}

export { ActuatorRepository };
