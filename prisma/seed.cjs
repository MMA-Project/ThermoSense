const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const SENSOR_BASELINE = {
  temperature: { base: 21, spread: 1.8, unit: "°C" },
  humidity: { base: 45, spread: 6, unit: "%" },
  co2: { base: 550, spread: 80, unit: "ppm" },
};

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function generateMeasurementValue(type) {
  const config = SENSOR_BASELINE[type] ?? { base: 10, spread: 2, unit: "unit" };
  const value = config.base + randomBetween(-config.spread, config.spread);
  return {
    value: Number(value.toFixed(2)),
    unit: config.unit,
  };
}

function inferActuatorStateFromAction(action) {
  if (action === "open") {
    return "open";
  }
  if (action === "close") {
    return "closed";
  }
  if (action === "on") {
    return "on";
  }
  return "off";
}

async function main() {
  await prisma.user.deleteMany();
  await prisma.actuatorCommand.deleteMany();
  await prisma.measurement.deleteMany();
  await prisma.alertThreshold.deleteMany();
  await prisma.actuator.deleteMany();
  await prisma.sensor.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.building.deleteMany();

  const building = await prisma.building.create({
    data: {
      name: "ThermoSense HQ",
      address: "10 rue des Capteurs, Paris",
    },
  });

  // Seed Users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  await prisma.user.createMany({
    data: [
      {
        email: "admin@thermosense.com",
        password: adminPassword,
        name: "Admin User",
        role: "admin",
      },
      {
        email: "user@thermosense.com",
        password: userPassword,
        name: "Regular User",
        role: "user",
      },
    ],
  });

  const zoneDefinitions = [
    { name: "Zone A", description: "Open space nord" },
    { name: "Zone B", description: "Atelier production" },
    { name: "Zone C", description: "Salle serveurs" },
  ];

  const zones = [];

  for (const zoneDefinition of zoneDefinitions) {
    const zone = await prisma.zone.create({
      data: {
        name: zoneDefinition.name,
        description: zoneDefinition.description,
        buildingId: building.id,
      },
    });

    zones.push(zone);
  }

  const sensors = [];
  const actuators = [];

  for (const zone of zones) {
    const zoneSensors = await Promise.all([
      prisma.sensor.create({
        data: {
          name: `${zone.name} - Température`,
          zoneId: zone.id,
          type: "temperature",
          status: "active",
        },
      }),
      prisma.sensor.create({
        data: {
          name: `${zone.name} - Humidité`,
          zoneId: zone.id,
          type: "humidity",
          status: "active",
        },
      }),
      prisma.sensor.create({
        data: {
          name: `${zone.name} - CO2`,
          zoneId: zone.id,
          type: "co2",
          status: "active",
        },
      }),
    ]);

    sensors.push(...zoneSensors);

    const zoneActuators = await Promise.all([
      prisma.actuator.create({
        data: {
          name: `${zone.name} - Vanne air`,
          zoneId: zone.id,
          type: "damper",
          status: "active",
          state: "closed",
        },
      }),
      prisma.actuator.create({
        data: {
          name: `${zone.name} - Chauffage`,
          zoneId: zone.id,
          type: "heater",
          status: "active",
          state: "off",
        },
      }),
    ]);

    actuators.push(...zoneActuators);

    await prisma.alertThreshold.createMany({
      data: [
        {
          zoneId: zone.id,
          type: "temperature",
          minValue: 18,
          maxValue: 26,
        },
        {
          zoneId: zone.id,
          type: "humidity",
          minValue: 30,
          maxValue: 60,
        },
        {
          zoneId: zone.id,
          type: "co2",
          minValue: 350,
          maxValue: 1100,
        },
      ],
    });
  }

  const now = new Date();
  const historyLength = 48;
  const intervalMinutes = 30;

  for (const sensor of sensors) {
    const batch = [];

    for (let i = historyLength - 1; i >= 0; i -= 1) {
      const timestamp = new Date(
        now.getTime() - i * intervalMinutes * 60 * 1000,
      );
      const generated = generateMeasurementValue(sensor.type);

      batch.push({
        sensorId: sensor.id,
        value: generated.value,
        unit: generated.unit,
        timestamp,
      });
    }

    await prisma.measurement.createMany({ data: batch });
  }

  for (const actuator of actuators) {
    const actionSequence =
      actuator.type === "heater"
        ? ["on", "on", "off"]
        : ["open", "open", "close"];

    let currentState = actuator.state;

    for (let i = 0; i < actionSequence.length; i += 1) {
      const action = actionSequence[i];
      const resultingState = inferActuatorStateFromAction(action);
      const commandAt = new Date(
        now.getTime() - (actionSequence.length - i) * 20 * 60 * 1000,
      );
      const noOp = currentState === resultingState;

      await prisma.actuatorCommand.create({
        data: {
          actuatorId: actuator.id,
          action,
          previousState: currentState,
          resultingState,
          wasNoop: noOp,
          createdAt: commandAt,
        },
      });

      currentState = resultingState;
    }

    await prisma.actuator.update({
      where: { id: actuator.id },
      data: {
        state: currentState,
        lastCommandAt: now,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    "Seed completed: buildings, zones, sensors, actuators, thresholds, measurements, commands.",
  );
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
