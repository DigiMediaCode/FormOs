-- AlterTable
ALTER TABLE "UserSubscription" ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ADD COLUMN     "trialPlanId" TEXT,
ADD COLUMN     "trialStartedAt" TIMESTAMP(3),
ADD COLUMN     "trialUsedAt" TIMESTAMP(3);
