-- Supabase exposes tables in the public schema through its API surface.
-- FormOS uses server-side Prisma access, so public API roles should not have
-- direct table access and every application table should have RLS enabled.

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'AuthToken',
    'BillingEvent',
    'BusinessProfile',
    'Form',
    'FormSubmission',
    'PlatformSetting',
    'SubmissionEvent',
    'SubscriptionPlan',
    'User',
    'UserIntegration',
    'UserOAuthAccount',
    'UserOnboardingState',
    'UserQuotaOverride',
    'UserSubscription',
    'UserUploadSettings',
    'Workspace',
    'WorkspaceInvite',
    'WorkspaceMember'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
  END IF;
END $$;
