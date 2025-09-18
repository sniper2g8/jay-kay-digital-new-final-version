import { supabase } from './supabase';
import type { 
  AuditLog, 
  CreateAuditLogRequest, 
  AuditLogFilters, 
  AuditStatistics 
} from './backup-audit.types';

// Audit Log Management
export class AuditLogger {
  // Create audit log entry
  static async log(request: CreateAuditLogRequest): Promise<void> {
    try {
      // Get user information if available
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get request information if in browser
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : undefined;
      const requestPath = typeof window !== 'undefined' ? window.location.pathname : undefined;
      
      const auditEntry: Partial<AuditLog> = {
        event_type: request.event_type,
        table_name: request.table_name,
        record_id: request.record_id,
        user_id: user?.id,
        user_email: user?.email,
        user_agent: userAgent,
        request_path: requestPath,
        old_values: request.old_values,
        new_values: request.new_values,
        changes_summary: request.changes_summary,
        severity: request.severity || 'INFO',
        category: request.category || 'DATA_CHANGE',
        source: 'WEB_APP',
        context: request.context,
        error_message: request.error_message,
        timestamp: new Date().toISOString(),
      };

      // TODO: Uncomment when audit_logs table is created in database
      // const { error } = await supabase
      //   .from('audit_logs')
      //   .insert(auditEntry);

      // if (error) {
      //   console.error('Failed to create audit log:', error);
      // }
      
      // For now, just console log the audit entry
      
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  // Helper methods for common audit events
  static async logLogin(userEmail: string, success: boolean): Promise<void> {
    await this.log({
      event_type: success ? 'LOGIN' : 'ERROR',
      changes_summary: success 
        ? `User ${userEmail} logged in successfully`
        : `Failed login attempt for ${userEmail}`,
      severity: success ? 'INFO' : 'WARNING',
      category: 'AUTHENTICATION',
      context: { login_success: success }
    });
  }

  static async logLogout(userEmail: string): Promise<void> {
    await this.log({
      event_type: 'LOGOUT',
      changes_summary: `User ${userEmail} logged out`,
      severity: 'INFO',
      category: 'AUTHENTICATION'
    });
  }

  static async logDataCreate(tableName: string, recordId: string, newData: Record<string, unknown>): Promise<void> {
    await this.log({
      event_type: 'CREATE',
      table_name: tableName,
      record_id: recordId,
      new_values: newData,
      changes_summary: `Created new ${tableName} record`,
      severity: 'INFO',
      category: 'DATA_CHANGE'
    });
  }

  static async logDataUpdate(
    tableName: string, 
    recordId: string, 
    oldData: Record<string, unknown>, 
    newData: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      event_type: 'UPDATE',
      table_name: tableName,
      record_id: recordId,
      old_values: oldData,
      new_values: newData,
      changes_summary: `Updated ${tableName} record`,
      severity: 'INFO',
      category: 'DATA_CHANGE'
    });
  }

  static async logDataDelete(tableName: string, recordId: string, oldData: Record<string, unknown>): Promise<void> {
    await this.log({
      event_type: 'DELETE',
      table_name: tableName,
      record_id: recordId,
      old_values: oldData,
      changes_summary: `Deleted ${tableName} record`,
      severity: 'WARNING',
      category: 'DATA_CHANGE'
    });
  }

  static async logSecurityEvent(message: string, severity: 'WARNING' | 'ERROR' | 'CRITICAL' = 'WARNING'): Promise<void> {
    await this.log({
      event_type: 'ERROR',
      changes_summary: message,
      severity,
      category: 'SECURITY'
    });
  }

  static async logSystemEvent(message: string, context?: Record<string, unknown>): Promise<void> {
    await this.log({
      event_type: 'SYSTEM',
      changes_summary: message,
      severity: 'INFO',
      category: 'SYSTEM',
      context
    });
  }

  static async logError(message: string, error: Error, context?: Record<string, unknown>): Promise<void> {
    await this.log({
      event_type: 'ERROR',
      changes_summary: message,
      error_message: error.message,
      severity: 'ERROR',
      category: 'SYSTEM',
      context: {
        ...context,
        error_stack: error.stack
      }
    });
  }
}

// Audit Log Retrieval
export class AuditLogService {
  // Get audit logs with filters
  static async getAuditLogs(filters: AuditLogFilters = {}): Promise<{ data: AuditLog[]; count: number }> {
    // TODO: Uncomment when audit_logs table is created
    // let query = supabase
    //   .from('audit_logs')
    //   .select('*', { count: 'exact' })
    //   .order('timestamp', { ascending: false });

    // For now, return empty data
    
    return { data: [], count: 0 };

    // Apply filters
    // if (filters.start_date) {
    //   query = query.gte('timestamp', filters.start_date);
    // }
    // ... rest of filters

    // const { data, error, count } = await query;

    // if (error) {
    //   throw new Error(`Failed to fetch audit logs: ${error.message}`);
    // }

    // return { data: data || [], count: count || 0 };
  }

  // Get audit statistics
  static async getAuditStatistics(): Promise<AuditStatistics> {
    // TODO: Implement when audit_logs table is available
    
    return {
      total_events: 0,
      events_by_type: {},
      events_by_severity: {},
      events_by_category: {},
      top_users: [],
      recent_errors: [],
      events_today: 0,
      events_this_week: 0
    };
  }

  // Clean up old audit logs
  static async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    // TODO: Implement when audit_logs table is available
    
    return 0;
  }

  // Export audit logs
  static async exportAuditLogs(filters: AuditLogFilters = {}): Promise<string> {
    const { data } = await this.getAuditLogs(filters);
    
    // Convert to CSV
    const headers = [
      'Timestamp', 'Event Type', 'Table', 'User Email', 'Severity', 
      'Category', 'Summary', 'Error Message'
    ];
    
    const csvRows = [
      headers.join(','),
      ...data.map(log => [
        log.timestamp,
        log.event_type,
        log.table_name || '',
        log.user_email || '',
        log.severity,
        log.category,
        `"${log.changes_summary || ''}"`,
        `"${log.error_message || ''}"`
      ].join(','))
    ];

    return csvRows.join('\n');
  }
}

// Higher-order component for automatic audit logging
export function withAuditLogging<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  eventType: AuditLog['event_type'],
  tableName?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      const result = await fn(...args);
      
      await AuditLogger.log({
        event_type: eventType,
        table_name: tableName,
        changes_summary: `Successfully executed ${fn.name}`,
        severity: 'INFO',
        category: 'SYSTEM'
      });

      return result;
    } catch (error) {
      await AuditLogger.logError(
        `Error in ${fn.name}`,
        error as Error,
        { function_args: args }
      );
      throw error;
    }
  }) as T;
}