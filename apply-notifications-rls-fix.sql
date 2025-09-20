-- Apply RLS fixes for notifications table with service role bypass

-- Create service role bypass policy (this allows service role to bypass RLS)
CREATE POLICY "service_role_bypass_notifications" 
ON notifications 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Also ensure the existing policies are correct
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
CREATE POLICY "users_read_own_notifications" 
ON notifications 
FOR SELECT 
USING (recipient_id = auth.uid() OR recipient_id IS NULL);

DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
CREATE POLICY "users_insert_notifications" 
ON notifications 
FOR INSERT 
WITH CHECK (recipient_id = auth.uid() OR recipient_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "users_update_own_notifications" 
ON notifications 
FOR UPDATE 
USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "users_delete_own_notifications" 
ON notifications 
FOR DELETE 
USING (recipient_id = auth.uid());

-- Grant necessary permissions
GRANT ALL ON notifications TO service_role;