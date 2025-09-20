-- Check if RLS is enabled on notifications table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications' AND schemaname = 'public';

-- If RLS is enabled, check existing policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policy 
JOIN pg_class ON pg_policy.polrelid = pg_class.oid 
WHERE pg_class.relname = 'notifications';

-- If no policies exist or they're incorrect, create proper policies
-- First, enable RLS if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for SELECT - users can read their own notifications
CREATE POLICY "Users can read their own notifications" 
ON notifications 
FOR SELECT 
USING (recipient_id = auth.uid());

-- Create policy for INSERT - users can insert notifications (typically done by system)
CREATE POLICY "Users can insert notifications" 
ON notifications 
FOR INSERT 
WITH CHECK (recipient_id = auth.uid() OR recipient_id IS NULL);

-- Create policy for UPDATE - users can update their own notifications
CREATE POLICY "Users can update their own notifications" 
ON notifications 
FOR UPDATE 
USING (recipient_id = auth.uid());

-- Create policy for DELETE - users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
ON notifications 
FOR DELETE 
USING (recipient_id = auth.uid());

-- Grant necessary permissions to authenticated users
GRANT ALL ON notifications TO authenticated;