-- Comprehensive RLS fix for notification system tables with service role bypass

-- 1. First, disable RLS temporarily to avoid conflicts
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE "appUsers" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_preferences" DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_service_role_bypass" ON notifications;
DROP POLICY IF EXISTS "service_role_bypass_notifications" ON notifications;

DROP POLICY IF EXISTS "Admins can view all users" ON "appUsers";
DROP POLICY IF EXISTS "Users can view own record" ON "appUsers";
DROP POLICY IF EXISTS "authenticated_users_basic_read" ON "appUsers";
DROP POLICY IF EXISTS "users_read_own_profile" ON "appUsers";
DROP POLICY IF EXISTS "users_update_own_profile" ON "appUsers";
DROP POLICY IF EXISTS "service_role_bypass_appusers" ON "appUsers";

DROP POLICY IF EXISTS "Users can manage own preferences" ON "notification_preferences";
DROP POLICY IF EXISTS "service_role_bypass_preferences" ON "notification_preferences";

-- 3. Re-enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appUsers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY;

-- 4. Create service role bypass policies (these allow service role to bypass RLS)
CREATE POLICY "service_role_bypass_notifications" 
ON notifications 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_bypass_appusers" 
ON "appUsers" 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_bypass_preferences" 
ON "notification_preferences" 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 5. Create user policies for regular access
CREATE POLICY "users_read_own_notifications" 
ON notifications 
FOR SELECT 
USING (recipient_id = auth.uid() OR recipient_id IS NULL);

CREATE POLICY "users_insert_notifications" 
ON notifications 
FOR INSERT 
WITH CHECK (recipient_id = auth.uid() OR recipient_id IS NULL);

CREATE POLICY "users_update_own_notifications" 
ON notifications 
FOR UPDATE 
USING (recipient_id = auth.uid());

CREATE POLICY "users_delete_own_notifications" 
ON notifications 
FOR DELETE 
USING (recipient_id = auth.uid());

-- Policies for appUsers
CREATE POLICY "admins_view_all_users" 
ON "appUsers" 
FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM "appUsers" au 
  WHERE au.id = auth.uid() AND au.primary_role = 'admin'
));

CREATE POLICY "users_view_own_record" 
ON "appUsers" 
FOR SELECT 
USING (id = auth.uid());

-- Policies for notification_preferences
CREATE POLICY "users_manage_own_preferences" 
ON "notification_preferences" 
FOR ALL 
USING (user_id = auth.uid());

-- 6. Grant necessary permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON "appUsers" TO authenticated;
GRANT ALL ON "notification_preferences" TO authenticated;

-- 7. Grant service role full access
GRANT ALL ON notifications TO service_role;
GRANT ALL ON "appUsers" TO service_role;
GRANT ALL ON "notification_preferences" TO service_role;