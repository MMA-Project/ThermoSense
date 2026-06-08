import { ActuatorRepository } from "./actuator.repository";
import type { ActuatorModel, PatchActuator } from "./actuator.model";

interface ActuatorAccessContext {
  role: string;
  zoneIds: string[];
}

type PatchActuatorResult =
  | { status: "updated"; actuator: ActuatorModel }
  | { status: "not-found" };

class ActuatorService {
  constructor(private readonly actuatorRepository: ActuatorRepository) {}

  async patchActuatorById(
    id: string,
    actuatorPatch: PatchActuator,
    accessContext: ActuatorAccessContext,
  ): Promise<PatchActuatorResult> {
    if (actuatorPatch.id && actuatorPatch.id !== id) {
      throw new Error("Path id and body id must match");
    }

    const actuator = await this.actuatorRepository.findById(id);

    if (!actuator) {
      return { status: "not-found" };
    }

    if (!this.hasZoneAccess(actuator.zoneId, accessContext)) {
      return { status: "not-found" };
    }

    if (
      actuatorPatch.zoneId &&
      !this.hasZoneAccess(actuatorPatch.zoneId, accessContext)
    ) {
      return { status: "not-found" };
    }

    const updatedActuator = await this.actuatorRepository.updateById(
      id,
      actuatorPatch,
    );

    return { status: "updated", actuator: updatedActuator };
  }

  private hasZoneAccess(
    zoneId: string,
    accessContext: ActuatorAccessContext,
  ): boolean {
    return (
      accessContext.role === "admin" || accessContext.zoneIds.includes(zoneId)
    );
  }
}

export { ActuatorService };
