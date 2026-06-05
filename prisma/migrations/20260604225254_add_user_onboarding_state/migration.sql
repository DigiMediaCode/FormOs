-- CreateTable
CREATE TABLE "UserOnboardingState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOnboardingState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserOnboardingState_userId_key" ON "UserOnboardingState"("userId");

-- AddForeignKey
ALTER TABLE "UserOnboardingState" ADD CONSTRAINT "UserOnboardingState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
