import { MeasurementRepository } from "./measurement.repository";

class MeasurementService {
  constructor(private readonly measurementRepository: MeasurementRepository) {}
}

export { MeasurementService };
