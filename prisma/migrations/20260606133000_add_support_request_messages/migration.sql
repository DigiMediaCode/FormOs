-- CreateTable
CREATE TABLE "SupportRequestMessage" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "authorUserId" TEXT,
    "authorName" TEXT,
    "authorEmail" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "message" TEXT NOT NULL,
    "emailStatus" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportRequestMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportRequestMessage_requestId_idx" ON "SupportRequestMessage"("requestId");

-- CreateIndex
CREATE INDEX "SupportRequestMessage_authorUserId_idx" ON "SupportRequestMessage"("authorUserId");

-- CreateIndex
CREATE INDEX "SupportRequestMessage_visibility_idx" ON "SupportRequestMessage"("visibility");

-- CreateIndex
CREATE INDEX "SupportRequestMessage_createdAt_idx" ON "SupportRequestMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "SupportRequestMessage" ADD CONSTRAINT "SupportRequestMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "SupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportRequestMessage" ADD CONSTRAINT "SupportRequestMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
