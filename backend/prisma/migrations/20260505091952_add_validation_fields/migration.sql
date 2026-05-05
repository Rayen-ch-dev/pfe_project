-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "usedAt" TIMESTAMP(3),
ADD COLUMN     "validatedBy" TEXT;
