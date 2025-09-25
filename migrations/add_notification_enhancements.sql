-- Migration to add new notification types and create notification log table
-- Add new notification types to existing enum

-- First, add the new values to the notification_type enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'job_status_change';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'job_received';  
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'payment_received';

-- Create notification_log table for tracking delivery and errors
CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  
  -- Delivery tracking
  delivery_method VARCHAR(20) NOT NULL CHECK (delivery_method IN ('email', 'sms', 'push', 'webhook')),
  delivery_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  
  -- Provider information
  provider_name VARCHAR(50), -- e.g., 'resend', 'twilio', 'firebase'
  provider_message_id VARCHAR(255), -- External provider's message ID
  
  -- Delivery details
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ, -- For email open tracking
  clicked_at TIMESTAMPTZ, -- For link click tracking
  
  -- Error tracking
  error_code VARCHAR(50),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Metadata
  metadata JSONB, -- Additional provider-specific data
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_log_notification_id ON notification_log(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_delivery_status ON notification_log(delivery_status);
CREATE INDEX IF NOT EXISTS idx_notification_log_delivery_method ON notification_log(delivery_method);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at ON notification_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_log_provider_message_id ON notification_log(provider_message_id);

-- Create user notification preferences table (if not exists)
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Global preferences
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  
  -- Notification type preferences
  job_status_change_email BOOLEAN DEFAULT true,
  job_status_change_sms BOOLEAN DEFAULT false,
  job_received_email BOOLEAN DEFAULT true,
  job_received_sms BOOLEAN DEFAULT false,
  payment_received_email BOOLEAN DEFAULT true,
  payment_received_sms BOOLEAN DEFAULT false,
  
  -- Legacy notification preferences
  job_update_email BOOLEAN DEFAULT true,
  job_update_sms BOOLEAN DEFAULT false,
  payment_due_email BOOLEAN DEFAULT true,
  payment_due_sms BOOLEAN DEFAULT false,
  delivery_ready_email BOOLEAN DEFAULT true,
  delivery_ready_sms BOOLEAN DEFAULT false,
  system_alert_email BOOLEAN DEFAULT true,
  system_alert_sms BOOLEAN DEFAULT false,
  promotion_email BOOLEAN DEFAULT false,
  promotion_sms BOOLEAN DEFAULT false,
  reminder_email BOOLEAN DEFAULT true,
  reminder_sms BOOLEAN DEFAULT false,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create email templates table for standardized templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'send_invoice', 'send_statement'
  template_name VARCHAR(255) NOT NULL,
  
  -- Template content
  subject_template TEXT NOT NULL,
  html_template TEXT NOT NULL,
  text_template TEXT,
  
  -- Template variables/placeholders documentation
  available_variables JSONB, -- Array of available placeholder variables
  
  -- Template settings
  is_active BOOLEAN DEFAULT true,
  is_system_template BOOLEAN DEFAULT false, -- Cannot be deleted if true
  
  -- Company branding
  use_company_header BOOLEAN DEFAULT true,
  use_company_footer BOOLEAN DEFAULT true,
  
  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default email templates
INSERT INTO email_templates (template_key, template_name, subject_template, html_template, text_template, available_variables, is_system_template) VALUES 
(
  'send_invoice',
  'Send Invoice Template',
  'Invoice {{invoice_number}} from Jay Kay Digital Press',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .invoice-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .cta-button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; }
        .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Invoice Ready</h1>
        </div>
        <div class="content">
            <h2>Hello {{customer_name}},</h2>
            <p>Please find your invoice attached for the services provided.</p>
            
            <div class="invoice-details">
                <h3>🧾 Invoice Details</h3>
                <table class="table">
                    <tr><th>Invoice Number</th><td>{{invoice_number}}</td></tr>
                    <tr><th>Invoice Date</th><td>{{invoice_date}}</td></tr>
                    <tr><th>Due Date</th><td>{{due_date}}</td></tr>
                    <tr><th>Total Amount</th><td>{{total_amount}}</td></tr>
                </table>
            </div>
            
            <div style="text-align: center;">
                <a href="{{invoice_url}}" class="cta-button">View Invoice</a>
            </div>
            
            <p>If you have any questions about this invoice, please contact us.</p>
        </div>
        <div class="footer">
            <p>Thank you for your business!</p>
            <p>Jay Kay Digital Press<br>
            Email: info@jaykaydigitalpress.com<br>
            Phone: +232 XX XXX XXXX</p>
        </div>
    </div>
</body>
</html>',
  'Invoice {{invoice_number}} from Jay Kay Digital Press

Hello {{customer_name}},

Please find your invoice details below:

Invoice Number: {{invoice_number}}
Invoice Date: {{invoice_date}}
Due Date: {{due_date}}
Total Amount: {{total_amount}}

View online: {{invoice_url}}

If you have any questions about this invoice, please contact us.

Thank you for your business!

Jay Kay Digital Press
Email: info@jaykaydigitalpress.com
Phone: +232 XX XXX XXXX',
  '["customer_name", "invoice_number", "invoice_date", "due_date", "total_amount", "invoice_url", "company_name", "company_email", "company_phone"]',
  true
),
(
  'send_statement',
  'Send Statement Template', 
  'Account Statement - {{statement_period}} from Jay Kay Digital Press',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Account Statement</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .statement-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .cta-button { display: inline-block; padding: 12px 30px; background: #059669; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; }
        .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; }
        .balance { font-size: 1.2em; font-weight: bold; color: #059669; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Account Statement</h1>
        </div>
        <div class="content">
            <h2>Hello {{customer_name}},</h2>
            <p>Here is your account statement for {{statement_period}}.</p>
            
            <div class="statement-details">
                <h3>💰 Account Summary</h3>
                <table class="table">
                    <tr><th>Statement Period</th><td>{{statement_period}}</td></tr>
                    <tr><th>Opening Balance</th><td>{{opening_balance}}</td></tr>
                    <tr><th>Total Charges</th><td>{{total_charges}}</td></tr>
                    <tr><th>Total Payments</th><td>{{total_payments}}</td></tr>
                    <tr><th class="balance">Closing Balance</th><td class="balance">{{closing_balance}}</td></tr>
                </table>
            </div>
            
            <div style="text-align: center;">
                <a href="{{statement_url}}" class="cta-button">View Full Statement</a>
            </div>
            
            <p>Thank you for your continued business. If you have any questions about your statement, please contact us.</p>
        </div>
        <div class="footer">
            <p>Jay Kay Digital Press<br>
            Email: info@jaykaydigitalpress.com<br>
            Phone: +232 XX XXX XXXX</p>
        </div>
    </div>
</body>
</html>',
  'Account Statement - {{statement_period}} from Jay Kay Digital Press

Hello {{customer_name}},

Here is your account statement for {{statement_period}}.

Account Summary:
- Statement Period: {{statement_period}}
- Opening Balance: {{opening_balance}}
- Total Charges: {{total_charges}}
- Total Payments: {{total_payments}}
- Closing Balance: {{closing_balance}}

View full statement: {{statement_url}}

Thank you for your continued business. If you have any questions about your statement, please contact us.

Jay Kay Digital Press
Email: info@jaykaydigitalpress.com
Phone: +232 XX XXX XXXX',
  '["customer_name", "statement_period", "opening_balance", "total_charges", "total_payments", "closing_balance", "statement_url", "company_name", "company_email", "company_phone"]',
  true
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_notification_log_updated_at
    BEFORE UPDATE ON notification_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Notification log policies
CREATE POLICY "Users can view their own notification logs"
ON notification_log FOR SELECT
USING (
  notification_id IN (
    SELECT id FROM notifications WHERE recipient_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage all notification logs"
ON notification_log FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- User notification preferences policies
CREATE POLICY "Users can manage their own notification preferences"
ON user_notification_preferences FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage all notification preferences"
ON user_notification_preferences FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Email templates policies (read-only for users, full access for admins)
CREATE POLICY "Anyone can view active email templates"
ON email_templates FOR SELECT
USING (is_active = true);

CREATE POLICY "Service role can manage all email templates"
ON email_templates FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON notification_log TO authenticated;
GRANT ALL ON user_notification_preferences TO authenticated; 
GRANT SELECT ON email_templates TO authenticated;

GRANT ALL ON notification_log TO service_role;
GRANT ALL ON user_notification_preferences TO service_role;
GRANT ALL ON email_templates TO service_role;