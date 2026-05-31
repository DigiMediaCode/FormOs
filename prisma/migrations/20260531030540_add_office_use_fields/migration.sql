-- AlterTable
ALTER TABLE "FormSubmission" ADD COLUMN     "officeCompletedAt" TIMESTAMP(3),
ADD COLUMN     "officeCompletedById" TEXT,
ADD COLUMN     "officeData" JSONB;
