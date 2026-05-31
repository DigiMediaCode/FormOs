-- Add Dropbox as an upload integration provider and store each user's active upload provider.
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'DROPBOX';

DO $$ BEGIN
  CREATE TYPE "StorageProvider" AS ENUM ('GOOGLE_DRIVE', 'DROPBOX');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "UserUploadSettings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "activeProvider" "StorageProvider",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserUploadSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserUploadSettings_userId_key" ON "UserUploadSettings"("userId");

DO $$ BEGIN
  ALTER TABLE "UserUploadSettings"
    ADD CONSTRAINT "UserUploadSettings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
