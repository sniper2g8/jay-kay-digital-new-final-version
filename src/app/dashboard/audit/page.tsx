"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Shield,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  RefreshCw,
  Eye,
  FileText,
  Database,
  Settings,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedDashboard from "@/components/ProtectedDashboard";

// Types for audit data
interface AuditLogEntry {
  id: string;
  action: string;
  resource_type: "user" | "job" | "customer" | "finance" | "system" | "auth" | "database";
  resource_id?: string;
  user_id: string;
  user_email: string;
  timestamp: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "success" | "failed" | "warning";
}

// Mock audit data
const mockAuditLogs: AuditLogEntry[] = [
  {
    id: "audit_001",
    action: "user_login",
    resource_type: "auth",
    user_id: "user_001",
    user_email: "admin@jaykaydigital.com",
    timestamp: "2025-01-20T14:30:00Z",
    details: { method: "email_password", success: true },
    ip_address: "192.168.1.100",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    severity: "low",
    status: "success"
  },
  {
    id: "audit_002",
    action: "job_created",
    resource_type: "job",
    resource_id: "job_114",
    user_id: "user_002",
    user_email: "operator@jaykaydigital.com",
    timestamp: "2025-01-20T13:45:00Z",
    details: { 
      job_number: "JKDP-JOB-0114",
      customer_id: "cust_045",
      service_type: "business_cards",
      total_amount: 150000
    },
    ip_address: "192.168.1.105",
    severity: "medium",
    status: "success"
  },
  {
    id: "audit_003",
    action: "customer_data_updated",
    resource_type: "customer",
    resource_id: "cust_045",
    user_id: "user_001",
    user_email: "admin@jaykaydigital.com",
    timestamp: "2025-01-20T12:15:00Z",
    details: {
      fields_changed: ["phone", "address"],
      old_phone: "+232 76 123456",
      new_phone: "+232 76 123457",
      old_address: "123 Main St",
      new_address: "123 Main Street, Freetown"
    },
    ip_address: "192.168.1.100",
    severity: "medium",
    status: "success"
  },
  {
    id: "audit_004",
    action: "failed_login_attempt",
    resource_type: "auth",
    user_id: "unknown",
    user_email: "suspicious@example.com",
    timestamp: "2025-01-20T10:30:00Z",
    details: { 
      method: "email_password", 
      reason: "invalid_credentials",
      attempts: 5
    },
    ip_address: "203.0.113.45",
    user_agent: "Automated Script",
    severity: "high",
    status: "failed"
  },
  {
    id: "audit_005",
    action: "database_backup_created",
    resource_type: "system",
    user_id: "system",
    user_email: "system@jaykaydigital.com",
    timestamp: "2025-01-20T08:00:00Z",
    details: {
      backup_type: "full",
      file_size: "15.2MB",
      duration: "5m 30s",
      tables_backed_up: 5
    },
    severity: "low",
    status: "success"
  },
  {
    id: "audit_006",
    action: "user_role_changed",
    resource_type: "user",
    resource_id: "user_003",
    user_id: "user_001",
    user_email: "admin@jaykaydigital.com",
    timestamp: "2025-01-19T16:20:00Z",
    details: {
      target_user: "manager@jaykaydigital.com",
      old_role: "operator",
      new_role: "manager",
      reason: "promotion"
    },
    ip_address: "192.168.1.100",
    severity: "high",
    status: "success"
  }
];

function AuditContent() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState("");

  const refreshAuditLogs = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Filter logs based on search and filters
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesResource = !resourceFilter || log.resource_type === resourceFilter;
    const matchesSeverity = !severityFilter || log.severity === severityFilter;
    const matchesStatus = !statusFilter || log.status === statusFilter;
    
    // Basic date filtering (last 24h, 7d, 30d)
    let matchesDate = true;
    if (dateRange) {
      const now = new Date();
      const logDate = new Date(log.timestamp);
      const diffHours = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60);
      
      switch (dateRange) {
        case "24h":
          matchesDate = diffHours <= 24;
          break;
        case "7d":
          matchesDate = diffHours <= 24 * 7;
          break;
        case "30d":
          matchesDate = diffHours <= 24 * 30;
          break;
      }
    }
    
    return matchesSearch && matchesResource && matchesSeverity && matchesStatus && matchesDate;
  });

  // Calculate statistics
  const stats = {
    total_entries: auditLogs.length,
    high_severity: auditLogs.filter(log => log.severity === "high" || log.severity === "critical").length,
    failed_actions: auditLogs.filter(log => log.status === "failed").length,
    recent_logins: auditLogs.filter(log => log.action === "user_login" && log.status === "success").length
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case "user":
        return <User className="h-4 w-4" />;
      case "job":
        return <FileText className="h-4 w-4" />;
      case "customer":
        return <UserCheck className="h-4 w-4" />;
      case "finance":
        return <Activity className="h-4 w-4" />;
      case "system":
        return <Settings className="h-4 w-4" />;
      case "auth":
        return <Shield className="h-4 w-4" />;
      case "database":
        return <Database className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="px-6 py-6 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading audit logs...</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Audit Reports
              </h1>
              <p className="text-gray-600">
                Monitor system activity and security events
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Button onClick={refreshAuditLogs} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Events
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_entries}</div>
                <p className="text-xs text-muted-foreground">
                  Audit log entries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  High Priority
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.high_severity}
                </div>
                <p className="text-xs text-muted-foreground">
                  Critical & high severity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Failed Actions
                </CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.failed_actions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Unsuccessful operations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Sessions
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.recent_logins}
                </div>
                <p className="text-xs text-muted-foreground">
                  Recent logins
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label>Search Events</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search actions, users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Resource</Label>
                  <Select value={resourceFilter} onValueChange={setResourceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Resources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Resources</SelectItem>
                      <SelectItem value="user">Users</SelectItem>
                      <SelectItem value="job">Jobs</SelectItem>
                      <SelectItem value="customer">Customers</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="auth">Authentication</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Levels</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Time Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Time</SelectItem>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("");
                      setResourceFilter("");
                      setSeverityFilter("");
                      setStatusFilter("");
                      setDateRange("");
                    }}
                    className="w-full"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Log List */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Log Entries</CardTitle>
              <CardDescription>
                System activity and security events ({filteredLogs.length} entries)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No audit entries found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="bg-gray-100 p-3 rounded-lg">
                          {getResourceIcon(log.resource_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </h3>
                            <Badge className={getSeverityColor(log.severity)}>
                              {log.severity.toUpperCase()}
                            </Badge>
                            <Badge className={getStatusColor(log.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(log.status)}
                                <span className="capitalize">{log.status}</span>
                              </div>
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>User:</strong> {log.user_email}</p>
                            <p><strong>Time:</strong> {new Date(log.timestamp).toLocaleString()}</p>
                            {log.resource_id && (
                              <p><strong>Resource ID:</strong> {log.resource_id}</p>
                            )}
                            {log.ip_address && (
                              <p><strong>IP Address:</strong> {log.ip_address}</p>
                            )}
                          </div>

                          {/* Details Preview */}
                          {Object.keys(log.details).length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                              <strong>Details:</strong>
                              <pre className="mt-1 text-gray-700 whitespace-pre-wrap">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Main component with role-based protection
export default function AuditPage() {
  return (
    <ProtectedDashboard
      allowedRoles={["super_admin", "admin"]}
    >
      <AuditContent />
    </ProtectedDashboard>
  );
}