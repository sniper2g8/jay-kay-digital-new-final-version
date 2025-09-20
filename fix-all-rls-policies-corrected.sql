-- Fix RLS policies for all notification-related tables

-- 1. Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- 3. Create new policies for notifications table
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

-- 4. Enable RLS on appUsers table
ALTER TABLE "appUsers" ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist (including the problematic recursive one)
DROP POLICY IF EXISTS "Admins can view all users" ON "appUsers";
DROP POLICY IF EXISTS "Users can view own record" ON "appUsers";
DROP POLICY IF EXISTS "service_role_bypass_appusers" ON "appUsers";
DROP POLICY IF EXISTS "users_read_own_record" ON "appUsers";
DROP POLICY IF EXISTS "users_update_own_record" ON "appUsers";

-- 6. Create clean policies for appUsers table that avoid recursion
-- Service role bypass (allows server-side operations)
CREATE POLICY "service_role_bypass_appusers" 
ON "appUsers" 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Users can view their own record
CREATE POLICY "users_read_own_record" 
ON "appUsers" 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- Users can update their own record
CREATE POLICY "users_update_own_record" 
ON "appUsers" 
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 7. Enable RLS on notification_preferences table
ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY;

-- 8. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own preferences" ON "notification_preferences";

-- 9. Create new policies for notification_preferences table
CREATE POLICY "Users can manage own preferences" 
ON "notification_preferences" 
FOR ALL 
USING (user_id = auth.uid());

-- 10. Grant necessary permissions to authenticated users
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON "appUsers" TO authenticated;
GRANT ALL ON "notification_preferences" TO authenticated;