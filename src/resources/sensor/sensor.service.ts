import { SensorRepository } from "./sensor.repository";

class SensorService {
  constructor(private readonly sensorRepository: SensorRepository) {}
}

export { SensorService };
