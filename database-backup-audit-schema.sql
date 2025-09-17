-- Database Backup and Audit System Schema
-- This file contains the SQL schema for backup management and audit logging

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event Information
    event_type VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', etc.
    table_name VARCHAR(100), -- Table affected (if applicable)
    record_id VARCHAR(100), -- ID of affected record
    
    -- User Information
    user_id UUID REFERENCES appUsers(id),
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    session_id VARCHAR(255),
    
    -- Request Information
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10), -- GET, POST, PUT, DELETE
    request_path TEXT,
    
    -- Change Details
    old_values JSONB, -- Previous values (for updates/deletes)
    new_values JSONB, -- New values (for creates/updates)
    changes_summary TEXT, -- Human-readable description
    
    -- Metadata
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    severity VARCHAR(20) DEFAULT 'INFO', -- INFO, WARNING, ERROR, CRITICAL
    category VARCHAR(50), -- AUTHENTICATION, DATA_CHANGE, SYSTEM, SECURITY
    source VARCHAR(50) DEFAULT 'WEB_APP', -- WEB_APP, API, SYSTEM, MIGRATION
    
    -- Additional Context
    context JSONB, -- Additional context data
    error_message TEXT, -- If this was an error event
    
    -- Search and Performance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DATABASE BACKUP LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Backup Information
    backup_type VARCHAR(20) NOT NULL, -- 'FULL', 'INCREMENTAL', 'DIFFERENTIAL'
    backup_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'
    
    -- File Information
    backup_filename VARCHAR(255),
    backup_path TEXT,
    backup_size_bytes BIGINT,
    backup_duration_seconds INTEGER,
    
    -- Verification
    checksum VARCHAR(255), -- File integrity checksum
    verification_status VARCHAR(20), -- 'PENDING', 'VERIFIED', 'FAILED'
    verification_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Schedule Information
    scheduled_backup BOOLEAN DEFAULT FALSE,
    backup_schedule_id UUID,
    
    -- Storage Information
    storage_location VARCHAR(100), -- 'LOCAL', 'S3', 'GCS', 'AZURE'
    storage_path TEXT,
    retention_days INTEGER DEFAULT 30,
    
    -- Metadata
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES appUsers(id),
    
    -- Error Handling
    error_message TEXT,
    error_details JSONB,
    
    -- Search fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BACKUP SCHEDULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS backup_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Schedule Configuration
    name VARCHAR(100) NOT NULL,
    description TEXT,
    backup_type VARCHAR(20) NOT NULL, -- 'FULL', 'INCREMENTAL'
    
    -- Cron Expression for scheduling
    cron_expression VARCHAR(50) NOT NULL, -- e.g., '0 2 * * *' for daily at 2 AM
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Retention Policy
    retention_days INTEGER DEFAULT 30,
    max_backups INTEGER DEFAULT 10, -- Maximum number of backups to keep
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    
    -- Storage Settings
    storage_location VARCHAR(100) DEFAULT 'LOCAL',
    storage_config JSONB, -- Storage-specific configuration
    
    -- Notifications
    notify_on_success BOOLEAN DEFAULT FALSE,
    notify_on_failure BOOLEAN DEFAULT TRUE,
    notification_emails TEXT[], -- Array of email addresses
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES appUsers(id)
);

-- =====================================================
-- SYSTEM SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Setting Identification
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_category VARCHAR(50) NOT NULL, -- 'BACKUP', 'AUDIT', 'SECURITY', 'GENERAL'
    
    -- Setting Value
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(20) NOT NULL, -- 'STRING', 'INTEGER', 'BOOLEAN', 'JSON', 'ARRAY'
    
    -- Validation
    allowed_values JSONB, -- For enum-type settings
    validation_rules JSONB, -- Validation constraints
    
    -- Metadata
    display_name VARCHAR(100),
    description TEXT,
    is_secret BOOLEAN DEFAULT FALSE, -- For sensitive settings like API keys
    requires_restart BOOLEAN DEFAULT FALSE, -- If changing this requires app restart
    
    -- Change Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES appUsers(id),
    
    -- Version Control
    version INTEGER DEFAULT 1,
    previous_value JSONB -- Store previous value for rollback
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);

-- Backup Logs Indexes
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON backup_logs(backup_status);
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON backup_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_logs_backup_type ON backup_logs(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_logs_schedule_id ON backup_logs(backup_schedule_id);

-- System Settings Indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(setting_category);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Audit Logs - Read access for authenticated users, write for system
CREATE POLICY "audit_logs_read_policy" ON audit_logs FOR SELECT
TO authenticated USING (true);

CREATE POLICY "audit_logs_insert_policy" ON audit_logs FOR INSERT
TO authenticated WITH CHECK (true);

-- Backup Logs - Admin and Manager access only
CREATE POLICY "backup_logs_admin_policy" ON backup_logs FOR ALL
TO authenticated USING (
    EXISTS (
        SELECT 1 FROM appUsers 
        WHERE id = auth.uid() 
        AND primary_role IN ('admin', 'super_admin')
    )
);

-- Backup Schedules - Admin access only
CREATE POLICY "backup_schedules_admin_policy" ON backup_schedules FOR ALL
TO authenticated USING (
    EXISTS (
        SELECT 1 FROM appUsers 
        WHERE id = auth.uid() 
        AND primary_role IN ('admin', 'super_admin')
    )
);

-- System Settings - Super Admin only
CREATE POLICY "system_settings_superadmin_policy" ON system_settings FOR ALL
TO authenticated USING (
    EXISTS (
        SELECT 1 FROM appUsers 
        WHERE id = auth.uid() 
        AND primary_role = 'super_admin'
    )
);

-- =====================================================
-- AUDIT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION log_table_changes()
RETURNS TRIGGER AS $$
DECLARE
    audit_record audit_logs%ROWTYPE;
    user_info RECORD;
BEGIN
    -- Get current user information
    SELECT id, email, primary_role INTO user_info
    FROM appUsers 
    WHERE id = auth.uid();
    
    -- Populate audit record
    audit_record.table_name := TG_TABLE_NAME;
    audit_record.event_type := TG_OP;
    audit_record.user_id := user_info.id;
    audit_record.user_email := user_info.email;
    audit_record.user_role := user_info.primary_role;
    audit_record.timestamp := NOW();
    audit_record.category := 'DATA_CHANGE';
    audit_record.source := 'DATABASE_TRIGGER';
    
    -- Handle different operations
    IF TG_OP = 'DELETE' THEN
        audit_record.record_id := OLD.id::TEXT;
        audit_record.old_values := to_jsonb(OLD);
        audit_record.changes_summary := 'Record deleted from ' || TG_TABLE_NAME;
    ELSIF TG_OP = 'UPDATE' THEN
        audit_record.record_id := NEW.id::TEXT;
        audit_record.old_values := to_jsonb(OLD);
        audit_record.new_values := to_jsonb(NEW);
        audit_record.changes_summary := 'Record updated in ' || TG_TABLE_NAME;
    ELSIF TG_OP = 'INSERT' THEN
        audit_record.record_id := NEW.id::TEXT;
        audit_record.new_values := to_jsonb(NEW);
        audit_record.changes_summary := 'New record created in ' || TG_TABLE_NAME;
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_logs SELECT audit_record.*;
    
    -- Return appropriate value
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER INSTALLATION (commented out for manual setup)
-- =====================================================
-- Uncomment these to enable audit logging on specific tables:

-- CREATE TRIGGER customers_audit_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON customers
--     FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- CREATE TRIGGER jobs_audit_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON jobs
--     FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- CREATE TRIGGER invoices_audit_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON invoices
--     FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- CREATE TRIGGER payments_audit_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON payments
--     FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- =====================================================
-- DEFAULT SYSTEM SETTINGS
-- =====================================================
INSERT INTO system_settings (setting_key, setting_category, setting_value, setting_type, display_name, description) VALUES
('backup.enabled', 'BACKUP', 'true', 'BOOLEAN', 'Enable Automatic Backups', 'Enable or disable automatic database backups'),
('backup.retention_days', 'BACKUP', '30', 'INTEGER', 'Backup Retention Days', 'Number of days to keep backup files'),
('backup.max_backups', 'BACKUP', '10', 'INTEGER', 'Maximum Backups', 'Maximum number of backup files to keep'),
('backup.notification_emails', 'BACKUP', '[]', 'ARRAY', 'Backup Notification Emails', 'Email addresses to notify about backup status'),

('audit.enabled', 'AUDIT', 'true', 'BOOLEAN', 'Enable Audit Logging', 'Enable or disable audit logging'),
('audit.retention_days', 'AUDIT', '90', 'INTEGER', 'Audit Log Retention', 'Number of days to keep audit logs'),
('audit.log_level', 'AUDIT', '"INFO"', 'STRING', 'Audit Log Level', 'Minimum log level to record'),

('security.session_timeout', 'SECURITY', '24', 'INTEGER', 'Session Timeout (hours)', 'Automatic session timeout in hours'),
('security.max_login_attempts', 'SECURITY', '5', 'INTEGER', 'Max Login Attempts', 'Maximum failed login attempts before lockout'),
('security.password_min_length', 'SECURITY', '8', 'INTEGER', 'Minimum Password Length', 'Minimum required password length'),

('app.company_name', 'GENERAL', '"Jay Kay Digital Press"', 'STRING', 'Company Name', 'Company name for invoices and documents'),
('app.currency', 'GENERAL', '"SLL"', 'STRING', 'Default Currency', 'Default currency for transactions'),
('app.timezone', 'GENERAL', '"UTC"', 'STRING', 'System Timezone', 'Default timezone for the application')

ON CONFLICT (setting_key) DO NOTHING;