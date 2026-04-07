-- CreateEnum
CREATE TYPE "ActuatorStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "ActuatorState" AS ENUM ('open', 'closed', 'on', 'off');

-- CreateEnum
CREATE TYPE "ActuatorCommandAction" AS ENUM ('open', 'close', 'on', 'off');

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sensor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actuator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "ActuatorStatus",
    "state" "ActuatorState" NOT NULL DEFAULT 'closed',
    "lastCommandAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Actuator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActuatorCommand" (
    "id" TEXT NOT NULL,
    "actuatorId" TEXT NOT NULL,
    "action" "ActuatorCommandAction" NOT NULL,
    "previousState" "ActuatorState",
    "resultingState" "ActuatorState" NOT NULL,
    "wasNoop" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActuatorCommand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertThreshold" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Zone_buildingId_idx" ON "Zone"("buildingId");

-- CreateIndex
CREATE INDEX "Sensor_zoneId_idx" ON "Sensor"("zoneId");

-- CreateIndex
CREATE INDEX "Actuator_zoneId_idx" ON "Actuator"("zoneId");

-- CreateIndex
CREATE INDEX "ActuatorCommand_actuatorId_idx" ON "ActuatorCommand"("actuatorId");

-- CreateIndex
CREATE INDEX "ActuatorCommand_createdAt_idx" ON "ActuatorCommand"("createdAt");

-- CreateIndex
CREATE INDEX "Measurement_sensorId_idx" ON "Measurement"("sensorId");

-- CreateIndex
CREATE INDEX "Measurement_timestamp_idx" ON "Measurement"("timestamp");

-- CreateIndex
CREATE INDEX "AlertThreshold_zoneId_idx" ON "AlertThreshold"("zoneId");

-- CreateIndex
CREATE INDEX "AlertThreshold_type_idx" ON "AlertThreshold"("type");

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actuator" ADD CONSTRAINT "Actuator_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActuatorCommand" ADD CONSTRAINT "ActuatorCommand_actuatorId_fkey" FOREIGN KEY ("actuatorId") REFERENCES "Actuator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertThreshold" ADD CONSTRAINT "AlertThreshold_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
