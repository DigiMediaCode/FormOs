-- AlterTable
ALTER TABLE "User" ADD COLUMN     "premiumTemplateIdUsed" TEXT,
ADD COLUMN     "premiumTemplateTrialUsedAt" TIMESTAMP(3),
ADD COLUMN     "templateTrialStartedAt" TIMESTAMP(3);
