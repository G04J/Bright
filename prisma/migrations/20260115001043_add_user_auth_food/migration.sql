/*
  Warnings:

  - The values [FATS] on the enum `MacroType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MacroType_new" AS ENUM ('CALORIES', 'PROTEIN', 'CARBS', 'FAT');
ALTER TABLE "food_metrics" ALTER COLUMN "type" TYPE "MacroType_new" USING ("type"::text::"MacroType_new");
ALTER TYPE "MacroType" RENAME TO "MacroType_old";
ALTER TYPE "MacroType_new" RENAME TO "MacroType";
DROP TYPE "public"."MacroType_old";
COMMIT;

-- DropIndex
DROP INDEX "food_metrics_entryId_type_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "daily_summaries" ADD COLUMN     "caloriesAvg" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "food_entries" ADD COLUMN     "calories" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "heart_entries" ALTER COLUMN "bpm" DROP NOT NULL;

-- AlterTable
ALTER TABLE "hydration_entries" ALTER COLUMN "liters" DROP NOT NULL;

-- AlterTable
ALTER TABLE "sleep_entries" ALTER COLUMN "hours" DROP NOT NULL;

-- AlterTable
ALTER TABLE "weight_entries" ALTER COLUMN "weightKg" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "food_metrics_entryId_idx" ON "food_metrics"("entryId");
