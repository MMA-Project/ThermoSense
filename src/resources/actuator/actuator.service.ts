import { ActuatorRepository } from "./actuator.repository";

class ActuatorService {
  constructor(private readonly actuatorRepository: ActuatorRepository) {}
}

export { ActuatorService };
