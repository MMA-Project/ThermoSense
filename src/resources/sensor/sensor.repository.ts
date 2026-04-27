import { prisma } from "../../lib/prisma";

interface SensorWithZone {
  id: string;
  zoneId: string;
}

class SensorRepository {
  async findById(id: string): Promise<SensorWithZone | null> {
    return prisma.sensor.findUnique({
      where: { id },
      select: {
        id: true,
        zoneId: true,
      },
    });
  }

  async deleteById(id: string): Promise<void> {
    await prisma.sensor.delete({
      where: { id },
    });
  }
}

export { SensorRepository };
