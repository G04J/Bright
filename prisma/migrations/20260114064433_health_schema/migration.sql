/*
  Warnings:

  - You are about to drop the `health_data` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('STEPS', 'CARDIO', 'STRENGTH');

-- CreateEnum
CREATE TYPE "MacroType" AS ENUM ('CARBS', 'FATS', 'PROTEIN');

-- CreateEnum
CREATE TYPE "MicroType" AS ENUM ('POTASSIUM', 'CALCIUM', 'SODIUM');

-- DropTable
DROP TABLE "health_data";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_metrics" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "activity_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_metrics" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "type" "MacroType" NOT NULL,
    "grams" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "food_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sleep_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "quality" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sleep_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heart_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    "bpm" INTEGER NOT NULL,
    "resting" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "heart_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "micro_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "micro_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "micro_metrics" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "type" "MicroType" NOT NULL,
    "amountMg" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "micro_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hydration_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    "liters" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hydration_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weight_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "activity_entries_userId_timestamp_idx" ON "activity_entries"("userId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "activity_metrics_entryId_type_key" ON "activity_metrics"("entryId", "type");

-- CreateIndex
CREATE INDEX "food_entries_userId_timestamp_idx" ON "food_entries"("userId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "food_metrics_entryId_type_key" ON "food_metrics"("entryId", "type");

-- CreateIndex
CREATE INDEX "sleep_entries_userId_timestamp_idx" ON "sleep_entries"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "heart_entries_userId_timestamp_idx" ON "heart_entries"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "micro_entries_userId_timestamp_idx" ON "micro_entries"("userId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "micro_metrics_entryId_type_key" ON "micro_metrics"("entryId", "type");

-- CreateIndex
CREATE INDEX "hydration_entries_userId_timestamp_idx" ON "hydration_entries"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "weight_entries_userId_timestamp_idx" ON "weight_entries"("userId", "timestamp");

-- AddForeignKey
ALTER TABLE "activity_entries" ADD CONSTRAINT "activity_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_metrics" ADD CONSTRAINT "activity_metrics_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "activity_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_entries" ADD CONSTRAINT "food_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_metrics" ADD CONSTRAINT "food_metrics_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "food_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sleep_entries" ADD CONSTRAINT "sleep_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heart_entries" ADD CONSTRAINT "heart_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "micro_entries" ADD CONSTRAINT "micro_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "micro_metrics" ADD CONSTRAINT "micro_metrics_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "micro_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hydration_entries" ADD CONSTRAINT "hydration_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_entries" ADD CONSTRAINT "weight_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
