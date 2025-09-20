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

-- 5. Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all users" ON "appUsers";
DROP POLICY IF EXISTS "Users can view own record" ON "appUsers";

-- 6. Create new policies for appUsers table
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

-- 11. Verify the policies were created
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('notifications', 'appUsers', 'notification_preferences');