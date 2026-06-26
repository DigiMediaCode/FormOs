-- CreateTable
CREATE TABLE "BusinessDocument" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "clientId" TEXT,
    "sourceSubmissionId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "documentNumber" TEXT,
    "clientSnapshot" JSONB,
    "ownerSnapshot" JSONB,
    "scopeOfWork" TEXT,
    "terms" TEXT,
    "paymentTerms" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "totalAmount" DECIMAL(65,30),
    "currency" TEXT,
    "content" JSONB,
    "signatures" JSONB,
    "pdfFileId" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BusinessDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessDocument_ownerId_idx" ON "BusinessDocument"("ownerId");

-- CreateIndex
CREATE INDEX "BusinessDocument_workspaceId_idx" ON "BusinessDocument"("workspaceId");

-- CreateIndex
CREATE INDEX "BusinessDocument_clientId_idx" ON "BusinessDocument"("clientId");

-- CreateIndex
CREATE INDEX "BusinessDocument_sourceSubmissionId_idx" ON "BusinessDocument"("sourceSubmissionId");

-- CreateIndex
CREATE INDEX "BusinessDocument_type_status_idx" ON "BusinessDocument"("type", "status");

-- AddForeignKey
ALTER TABLE "BusinessDocument" ADD CONSTRAINT "BusinessDocument_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessDocument" ADD CONSTRAINT "BusinessDocument_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessDocument" ADD CONSTRAINT "BusinessDocument_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessDocument" ADD CONSTRAINT "BusinessDocument_sourceSubmissionId_fkey" FOREIGN KEY ("sourceSubmissionId") REFERENCES "FormSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
