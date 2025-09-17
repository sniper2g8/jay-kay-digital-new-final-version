// Backup and Audit System Types
export interface AuditLog {
  id: string;
  
  // Event Information
  event_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ACCESS' | 'ERROR' | 'SYSTEM';
  table_name?: string;
  record_id?: string;
  
  // User Information
  user_id?: string;
  user_email?: string;
  user_role?: string;
  session_id?: string;
  
  // Request Information
  ip_address?: string;
  user_agent?: string;
  request_method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  request_path?: string;
  
  // Change Details
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  changes_summary?: string;
  
  // Metadata
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  category: 'AUTHENTICATION' | 'DATA_CHANGE' | 'SYSTEM' | 'SECURITY' | 'BACKUP';
  source: 'WEB_APP' | 'API' | 'SYSTEM' | 'MIGRATION' | 'DATABASE_TRIGGER';
  
  // Additional Context
  context?: Record<string, unknown>;
  error_message?: string;
  
  created_at: string;
  indexed_at: string;
}

export interface BackupLog {
  id: string;
  
  // Backup Information
  backup_type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL';
  backup_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  
  // File Information
  backup_filename?: string;
  backup_path?: string;
  backup_size_bytes?: number;
  backup_duration_seconds?: number;
  
  // Verification
  checksum?: string;
  verification_status?: 'PENDING' | 'VERIFIED' | 'FAILED';
  verification_timestamp?: string;
  
  // Schedule Information
  scheduled_backup: boolean;
  backup_schedule_id?: string;
  
  // Storage Information
  storage_location: 'LOCAL' | 'S3' | 'GCS' | 'AZURE';
  storage_path?: string;
  retention_days: number;
  
  // Metadata
  started_at: string;
  completed_at?: string;
  created_by?: string;
  
  // Error Handling
  error_message?: string;
  error_details?: Record<string, unknown>;
  
  created_at: string;
}

export interface BackupSchedule {
  id: string;
  
  // Schedule Configuration
  name: string;
  description?: string;
  backup_type: 'FULL' | 'INCREMENTAL';
  
  // Cron Expression for scheduling
  cron_expression: string;
  timezone: string;
  
  // Retention Policy
  retention_days: number;
  max_backups: number;
  
  // Status
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  
  // Storage Settings
  storage_location: 'LOCAL' | 'S3' | 'GCS' | 'AZURE';
  storage_config?: Record<string, unknown>;
  
  // Notifications
  notify_on_success: boolean;
  notify_on_failure: boolean;
  notification_emails: string[];
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SystemSetting {
  id: string;
  
  // Setting Identification
  setting_key: string;
  setting_category: 'BACKUP' | 'AUDIT' | 'SECURITY' | 'GENERAL';
  
  // Setting Value
  setting_value: unknown;
  setting_type: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON' | 'ARRAY';
  
  // Validation
  allowed_values?: unknown[];
  validation_rules?: Record<string, unknown>;
  
  // Metadata
  display_name?: string;
  description?: string;
  is_secret: boolean;
  requires_restart: boolean;
  
  // Change Tracking
  created_at: string;
  updated_at: string;
  updated_by?: string;
  
  // Version Control
  version: number;
  previous_value?: unknown;
}

// Audit Log Creation Helper
export interface CreateAuditLogRequest {
  event_type: AuditLog['event_type'];
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  changes_summary?: string;
  severity?: AuditLog['severity'];
  category?: AuditLog['category'];
  context?: Record<string, unknown>;
  error_message?: string;
}

// Backup Job Configuration
export interface BackupJobConfig {
  backup_type: BackupLog['backup_type'];
  storage_location: BackupLog['storage_location'];
  retention_days?: number;
  notify_emails?: string[];
  compression?: boolean;
  encryption?: boolean;
}

// Audit Search Filters
export interface AuditLogFilters {
  start_date?: string;
  end_date?: string;
  user_id?: string;
  event_type?: AuditLog['event_type'];
  table_name?: string;
  severity?: AuditLog['severity'];
  category?: AuditLog['category'];
  search_term?: string;
  limit?: number;
  offset?: number;
}

// Backup Statistics
export interface BackupStatistics {
  total_backups: number;
  successful_backups: number;
  failed_backups: number;
  total_size_bytes: number;
  average_duration_seconds: number;
  last_backup_date?: string;
  next_scheduled_backup?: string;
  storage_usage_by_location: Record<string, number>;
}

// Audit Statistics
export interface AuditStatistics {
  total_events: number;
  events_by_type: Record<string, number>;
  events_by_severity: Record<string, number>;
  events_by_category: Record<string, number>;
  top_users: Array<{ user_email: string; event_count: number }>;
  recent_errors: AuditLog[];
  events_today: number;
  events_this_week: number;
}

// System Health Check
export interface SystemHealthCheck {
  database_status: 'HEALTHY' | 'WARNING' | 'ERROR';
  backup_status: 'HEALTHY' | 'WARNING' | 'ERROR';
  audit_status: 'HEALTHY' | 'WARNING' | 'ERROR';
  storage_status: 'HEALTHY' | 'WARNING' | 'ERROR';
  last_backup_age_hours?: number;
  disk_space_available_gb?: number;
  active_connections?: number;
  error_rate_24h?: number;
  warnings: string[];
  errors: string[];
}