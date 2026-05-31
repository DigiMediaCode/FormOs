-- Add a Lark Mail sender integration provider for storing sender mailbox OAuth tokens.
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'LARK_MAIL';
