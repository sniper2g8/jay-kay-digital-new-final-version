-- Fix RLS policies for notifications table

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

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

-- Also fix appUsers table policies
ALTER TABLE "appUsers" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all users" ON "appUsers";
DROP POLICY IF EXISTS "Users can view own record" ON "appUsers";

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

GRANT ALL ON "appUsers" TO authenticated;

-- Fix notification_preferences table policies
ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own preferences" ON "notification_preferences";

CREATE POLICY "Users can manage own preferences" 
ON "notification_preferences" 
FOR ALL 
USING (user_id = auth.uid());

GRANT ALL ON "notification_preferences" TO authenticated;