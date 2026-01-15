-- CreateTable
CREATE TABLE "daily_summaries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "stepsTotal" INTEGER NOT NULL DEFAULT 0,
    "cardioMinutes" INTEGER NOT NULL DEFAULT 0,
    "strengthMinutes" INTEGER NOT NULL DEFAULT 0,
    "carbsGrams" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fatsGrams" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proteinGrams" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sleepHours" DOUBLE PRECISION,
    "sleepQualityAvg" DOUBLE PRECISION,
    "restingBpmAvg" DOUBLE PRECISION,
    "bpmAvg" DOUBLE PRECISION,
    "potassiumMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calciumMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sodiumMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hydrationLiters" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weightKg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_summaries_userId_day_idx" ON "daily_summaries"("userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "daily_summaries_userId_day_key" ON "daily_summaries"("userId", "day");

-- AddForeignKey
ALTER TABLE "daily_summaries" ADD CONSTRAINT "daily_summaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
