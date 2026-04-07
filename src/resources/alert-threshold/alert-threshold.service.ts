import { AlertThresholdRepository } from "./alert-threshold.repository";

class AlertThresholdService {
  constructor(
    private readonly alertThresholdRepository: AlertThresholdRepository,
  ) {}
}

export { AlertThresholdService };
