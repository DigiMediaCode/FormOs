-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "stripeProductId" TEXT,
ADD COLUMN     "stripeSyncError" TEXT,
ADD COLUMN     "stripeSyncStatus" TEXT,
ADD COLUMN     "stripeSyncedAt" TIMESTAMP(3);
