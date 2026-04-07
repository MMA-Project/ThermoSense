import { ZoneRepository } from "./zone.repository";

class ZoneService {
  constructor(private readonly zoneRepository: ZoneRepository) {}
}

export { ZoneService };
