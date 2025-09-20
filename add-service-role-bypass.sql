-- Add service role bypass policies for all tables
-- The service_role should automatically bypass RLS, but let's ensure it works

-- For notifications table
CREATE POLICY "service_role_access_notifications" 
ON notifications 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- For appUsers table
CREATE POLICY "service_role_access_appusers" 
ON "appUsers" 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- For notification_preferences table
CREATE POLICY "service_role_access_notification_preferences" 
ON "notification_preferences" 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- Verify the policies were created
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('notifications', 'appUsers', 'notification_preferences')
ORDER BY tablename, policyname;