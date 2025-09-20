-- Fix RLS policies for notifications table
-- This script adds the necessary policies to allow users to access their own notifications

-- Enable RLS on notifications table (if not already enabled)
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

-- Verify the policies were created
SELECT * FROM pg_policies WHERE tablename = 'notifications';