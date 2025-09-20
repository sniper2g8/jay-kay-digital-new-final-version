-- Fix policies and indexes for email notifications
-- This migration addresses duplicate policy and index issues

-- Fix policies for email_notifications table
DROP POLICY IF EXISTS "Service role can manage email notifications" ON email_notifications;
CREATE POLICY "Service role can manage email notifications" ON email_notifications
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can view their own email notifications" ON email_notifications;
CREATE POLICY "Users can view their own email notifications" ON email_notifications
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    recipient_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Fix indexes for email_notifications table
DROP INDEX IF EXISTS idx_email_notifications_recipient;
CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient ON email_notifications(recipient_email);

DROP INDEX IF EXISTS idx_email_notifications_type;
CREATE INDEX IF NOT EXISTS idx_email_notifications_type ON email_notifications(type);

DROP INDEX IF EXISTS idx_email_notifications_sent_at;
CREATE INDEX IF NOT EXISTS idx_email_notifications_sent_at ON email_notifications(sent_at);

-- Ensure RLS is enabled
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;