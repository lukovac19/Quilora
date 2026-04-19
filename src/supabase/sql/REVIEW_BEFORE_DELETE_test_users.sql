-- =============================================================================
-- DANGER — REVIEW IN DASHBOARD SQL EDITOR BEFORE RUNNING
-- Deleting from auth.users cascades to dependent data; irreversible without backup.
-- =============================================================================

-- Step 1: Preview who would be removed (run this first):
-- SELECT id, email, created_at, email_confirmed_at
-- FROM auth.users
-- WHERE email ILIKE '%test%'
--    OR created_at < now() - interval '1 day'
-- ORDER BY created_at;

-- Step 2 (OPTION A — matches your request; VERY DESTRUCTIVE on a busy project):
-- Removes anyone with "test" in email OR any account created more than 24h ago.
-- DELETE FROM auth.users
-- WHERE email ILIKE '%test%'
--    OR created_at < now() - interval '1 day';

-- Step 2 (OPTION B — safer for cleanup of obvious test addresses only):
-- DELETE FROM auth.users
-- WHERE email ILIKE '%test%@%' OR email ILIKE '%@example.com' OR email ILIKE '%@example.org';

-- After deletion, verify: SELECT count(*) FROM auth.users;
