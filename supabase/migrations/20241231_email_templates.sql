-- Create email_templates table for storing custom email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'custom',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policy for email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Allow service role and admins to manage email templates
CREATE POLICY "Admins can manage email templates" ON email_templates
  FOR ALL USING (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND 
     auth.jwt() ->> 'user_role' = 'admin')
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(type);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_by ON email_templates(created_by);

-- Insert some default email templates
INSERT INTO email_templates (name, subject, content, type) VALUES
('Welcome Message', 'Welcome to JayKay Digital Press!', 'Welcome to our professional printing services! We''re excited to work with you and help bring your printing projects to life.

Our team is committed to delivering high-quality results and exceptional customer service. If you have any questions or need assistance with your projects, please don''t hesitate to reach out.

We look forward to a successful partnership!', 'custom'),

('Project Update', 'Update on Your Printing Project', 'We wanted to provide you with an update on your current printing project.

Our team has been working diligently on your order, and we''re pleased with the progress so far. We remain on track to meet your deadline and deliver the high-quality results you expect.

If you have any questions or would like additional details about your project status, please feel free to contact us.', 'custom'),

('Holiday Greeting', 'Season''s Greetings from JayKay Digital Press', 'As the holiday season approaches, we want to take a moment to express our gratitude for your continued business and partnership.

It has been our pleasure to work with you throughout the year, and we look forward to continuing to serve your printing needs in the year ahead.

Wishing you and your family a wonderful holiday season and a prosperous New Year!', 'custom'),

('Thank You Note', 'Thank You for Your Business!', 'We wanted to take a moment to thank you for choosing JayKay Digital Press for your printing needs.

Your trust in our services means the world to us, and we''re committed to continuing to exceed your expectations with every project.

We appreciate your business and look forward to working with you again soon!', 'custom')

ON CONFLICT DO NOTHING;