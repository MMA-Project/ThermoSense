import { SensorRepository } from "./sensor.repository";

interface SensorAccessContext {
  role: string;
  zoneIds: string[];
}

type DeleteSensorResult = { status: "deleted" } | { status: "not-found" };

class SensorService {
  constructor(private readonly sensorRepository: SensorRepository) {}

  async deleteSensorById(
    id: string,
    accessContext: SensorAccessContext,
  ): Promise<DeleteSensorResult> {
    const sensor = await this.sensorRepository.findById(id);

    if (!sensor) {
      return { status: "not-found" };
    }

    const hasPerimeterAccess =
      accessContext.role === "admin" ||
      accessContext.zoneIds.includes(sensor.zoneId);

    if (!hasPerimeterAccess) {
      return { status: "not-found" };
    }

    await this.sensorRepository.deleteById(id);
    return { status: "deleted" };
  }
}

export { SensorService };
