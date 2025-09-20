-- Temporarily disable RLS to test if that's the issue

-- Disable RLS on all tables
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE "appUsers" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_preferences" DISABLE ROW LEVEL SECURITY;

-- Test access
SELECT COUNT(*) FROM notifications LIMIT 1;
SELECT COUNT(*) FROM "appUsers" LIMIT 1;
SELECT COUNT(*) FROM "notification_preferences" LIMIT 1;

-- Re-enable RLS after testing
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "appUsers" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY;