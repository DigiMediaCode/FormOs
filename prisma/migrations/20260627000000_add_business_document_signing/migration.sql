-- Add tokenized external signing workflow fields for contracts and agreements.
ALTER TABLE "BusinessDocument"
ADD COLUMN "signingTokenHash" TEXT,
ADD COLUMN "signingTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "sentForSigningAt" TIMESTAMP(3),
ADD COLUMN "ownerSignedAt" TIMESTAMP(3),
ADD COLUMN "clientSignedAt" TIMESTAMP(3),
ADD COLUMN "finalPdfSentAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "BusinessDocument_signingTokenHash_key" ON "BusinessDocument"("signingTokenHash");
