-- Cleanup and reset all RLS policies for notification-related tables

-- First, disable RLS temporarily
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE "appUsers" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_preferences" DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on notifications table
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_service_role_bypass" ON notifications;

-- Drop all existing policies on appUsers table
DROP POLICY IF EXISTS "Admins can view all users" ON "appUsers";
DROP POLICY IF EXISTS "Users can view own record" ON "appUsers";
DROP POLICY IF EXISTS "authenticated_users_basic_read" ON "appUsers";
DROP POLICY IF EXISTS "users_read_own_profile" ON "appUsers";
DROP POLICY IF EXISTS "users_update_own_profile" ON "appUsers";

-- Drop all existing policies on notification_preferences table
DROP POLICY IF EXISTS "Users can manage own preferences" ON "notification_preferences";

-- Re-enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appUsers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY;

-- Create clean policies for notifications table
CREATE POLICY "Users can read their own notifications" 
ON notifications 
FOR SELECT 
USING (recipient_id = auth.uid() OR recipient_id IS NULL);

CREATE POLICY "Users can insert notifications" 
ON notifications 
FOR INSERT 
WITH CHECK (recipient_id = auth.uid() OR recipient_id IS NULL);

CREATE POLICY "Users can update their own notifications" 
ON notifications 
FOR UPDATE 
USING (recipient_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" 
ON notifications 
FOR DELETE 
USING (recipient_id = auth.uid());

-- Create clean policies for appUsers table
CREATE POLICY "Admins can view all users" 
ON "appUsers" 
FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM "appUsers" au 
  WHERE au.id = auth.uid() AND au.primary_role = 'admin'
));

CREATE POLICY "Users can view own record" 
ON "appUsers" 
FOR SELECT 
USING (id = auth.uid());

-- Create clean policies for notification_preferences table
CREATE POLICY "Users can manage own preferences" 
ON "notification_preferences" 
FOR ALL 
USING (user_id = auth.uid());

-- Grant necessary permissions to authenticated users
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON "appUsers" TO authenticated;
GRANT ALL ON "notification_preferences" TO authenticated;

-- Verify the policies were created
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('notifications', 'appUsers', 'notification_preferences')
ORDER BY tablename, policyname;