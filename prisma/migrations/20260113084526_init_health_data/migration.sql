-- CreateTable
CREATE TABLE "health_data" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    "steps" INTEGER,
    "calories" DOUBLE PRECISION,
    "sleepHours" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "health_data_userId_timestamp_idx" ON "health_data"("userId", "timestamp");
