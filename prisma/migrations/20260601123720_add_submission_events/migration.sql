-- CreateTable
CREATE TABLE "SubmissionEvent" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubmissionEvent_submissionId_idx" ON "SubmissionEvent"("submissionId");

-- CreateIndex
CREATE INDEX "SubmissionEvent_formId_idx" ON "SubmissionEvent"("formId");

-- CreateIndex
CREATE INDEX "SubmissionEvent_ownerId_idx" ON "SubmissionEvent"("ownerId");

-- CreateIndex
CREATE INDEX "SubmissionEvent_type_idx" ON "SubmissionEvent"("type");

-- AddForeignKey
ALTER TABLE "SubmissionEvent" ADD CONSTRAINT "SubmissionEvent_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
