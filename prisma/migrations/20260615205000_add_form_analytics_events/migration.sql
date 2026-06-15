-- CreateTable
CREATE TABLE "FormAnalyticsEvent" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormAnalyticsEvent_formId_createdAt_idx" ON "FormAnalyticsEvent"("formId", "createdAt");

-- CreateIndex
CREATE INDEX "FormAnalyticsEvent_ownerId_createdAt_idx" ON "FormAnalyticsEvent"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "FormAnalyticsEvent_type_createdAt_idx" ON "FormAnalyticsEvent"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "FormAnalyticsEvent" ADD CONSTRAINT "FormAnalyticsEvent_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormAnalyticsEvent" ADD CONSTRAINT "FormAnalyticsEvent_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
