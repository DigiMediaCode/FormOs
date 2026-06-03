-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "stripeMonthlyPriceId" TEXT,
ADD COLUMN     "stripeYearlyPriceId" TEXT;

-- AlterTable
ALTER TABLE "UserSubscription" ADD COLUMN     "billingProvider" TEXT,
ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "currentPeriodStart" TIMESTAMP(3),
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE INDEX "UserSubscription_stripeCustomerId_idx" ON "UserSubscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "UserSubscription_stripeSubscriptionId_idx" ON "UserSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "UserSubscription_stripePriceId_idx" ON "UserSubscription"("stripePriceId");
