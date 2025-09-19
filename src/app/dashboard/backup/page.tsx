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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Database,
  Download,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  RotateCcw,
  HardDrive,
  Shield,
  FileArchive,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedDashboard from "@/components/ProtectedDashboard";

// Types for backup data
interface BackupRecord {
  id: string;
  backup_type: "full" | "incremental" | "tables_only";
  status: "pending" | "running" | "completed" | "failed";
  file_path?: string;
  file_size?: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
  tables_included: string[];
  created_by: string;
}

// Mock backup data
const mockBackups: BackupRecord[] = [
  {
    id: "backup_001",
    backup_type: "full",
    status: "completed",
    file_path: "/backups/full_backup_2025_01_20.sql",
    file_size: 15728640, // 15MB in bytes
    created_at: "2025-01-20T08:00:00Z",
    completed_at: "2025-01-20T08:05:30Z",
    tables_included: ["customers", "jobs", "finances", "users", "notifications"],
    created_by: "admin@jaykaydigital.com"
  },
  {
    id: "backup_002",
    backup_type: "incremental",
    status: "completed",
    file_path: "/backups/incremental_backup_2025_01_19.sql",
    file_size: 2097152, // 2MB in bytes
    created_at: "2025-01-19T20:00:00Z",
    completed_at: "2025-01-19T20:01:15Z",
    tables_included: ["jobs", "finances"],
    created_by: "system"
  },
  {
    id: "backup_003",
    backup_type: "tables_only",
    status: "failed",
    created_at: "2025-01-18T12:00:00Z",
    error_message: "Connection timeout - unable to access database",
    tables_included: ["customers"],
    created_by: "manager@jaykaydigital.com"
  },
  {
    id: "backup_004",
    backup_type: "full",
    status: "running",
    created_at: "2025-01-20T14:30:00Z",
    tables_included: ["customers", "jobs", "finances", "users", "notifications"],
    created_by: "admin@jaykaydigital.com"
  }
];

function BackupContent() {
  const [backups, setBackups] = useState<BackupRecord[]>(mockBackups);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [newBackupType, setNewBackupType] = useState<"full" | "incremental" | "tables_only">("full");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const refreshBackups = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    
    // Simulate backup creation
    const newBackup: BackupRecord = {
      id: `backup_${Date.now()}`,
      backup_type: newBackupType,
      status: "pending",
      created_at: new Date().toISOString(),
      tables_included: newBackupType === "full" 
        ? ["customers", "jobs", "finances", "users", "notifications"]
        : ["jobs", "finances"],
      created_by: "current_user@jaykaydigital.com"
    };

    setBackups(prev => [newBackup, ...prev]);
    setIsDialogOpen(false);
    
    // Simulate processing
    setTimeout(() => {
      setBackups(prev => 
        prev.map(backup => 
          backup.id === newBackup.id 
            ? { 
                ...backup, 
                status: "running" as const
              }
            : backup
        )
      );
      
      // Complete after another delay
      setTimeout(() => {
        setBackups(prev => 
          prev.map(backup => 
            backup.id === newBackup.id 
              ? { 
                  ...backup, 
                  status: "completed" as const,
                  completed_at: new Date().toISOString(),
                  file_path: `/backups/${newBackupType}_backup_${new Date().toISOString().split('T')[0]}.sql`,
                  file_size: Math.floor(Math.random() * 20000000) + 1000000 // Random size 1-20MB
                }
              : backup
          )
        );
        setIsCreatingBackup(false);
      }, 3000);
    }, 2000);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return "In progress...";
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const minutes = Math.floor(diffSecs / 60);
    const seconds = diffSecs % 60;
    return `${minutes}m ${seconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "failed":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const stats = {
    total_backups: backups.length,
    completed_backups: backups.filter(b => b.status === "completed").length,
    failed_backups: backups.filter(b => b.status === "failed").length,
    running_backups: backups.filter(b => b.status === "running").length,
    total_size: backups
      .filter(b => b.status === "completed" && b.file_size)
      .reduce((sum, b) => sum + (b.file_size || 0), 0)
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="px-6 py-6 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading backups...</span>
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
                Database Backups
              </h1>
              <p className="text-gray-600">
                Manage database backups and recovery options
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Button onClick={refreshBackups} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={isCreatingBackup}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Backup
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Backup</DialogTitle>
                    <DialogDescription>
                      Select the type of backup to create
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Backup Type</Label>
                      <Select value={newBackupType} onValueChange={(value: "full" | "incremental" | "tables_only") => setNewBackupType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full Backup - All tables and data</SelectItem>
                          <SelectItem value="incremental">Incremental - Recent changes only</SelectItem>
                          <SelectItem value="tables_only">Tables Only - Structure without data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={createBackup} disabled={isCreatingBackup} className="flex-1">
                        {isCreatingBackup ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Database className="h-4 w-4 mr-2" />
                            Create Backup
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Backups
                </CardTitle>
                <FileArchive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_backups}</div>
                <p className="text-xs text-muted-foreground">
                  All backup attempts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.completed_backups}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successful backups
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Running/Pending
                </CardTitle>
                <Loader2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.running_backups}
                </div>
                <p className="text-xs text-muted-foreground">
                  In progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Size
                </CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatFileSize(stats.total_size)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Storage used
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Backup List */}
          <Card>
            <CardHeader>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>
                Recent database backup operations and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backups.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No backups found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your first backup to get started
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Backup
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {backups.map((backup) => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <Database className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900 capitalize">
                              {backup.backup_type.replace('_', ' ')} Backup
                            </h3>
                            <Badge className={getStatusColor(backup.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(backup.status)}
                                <span className="capitalize">{backup.status}</span>
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Created: {new Date(backup.created_at).toLocaleString()}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Tables: {backup.tables_included.join(', ')}</span>
                            <span>Duration: {formatDuration(backup.created_at, backup.completed_at)}</span>
                            {backup.file_size && (
                              <span>Size: {formatFileSize(backup.file_size)}</span>
                            )}
                          </div>
                          {backup.error_message && (
                            <p className="text-sm text-red-600 mt-1">
                              Error: {backup.error_message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {backup.status === "completed" && backup.file_path && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                        {backup.status === "failed" && (
                          <Button variant="outline" size="sm">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Retry
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          Details
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
export default function BackupPage() {
  return (
    <ProtectedDashboard
      allowedRoles={["super_admin", "admin"]}
    >
      <BackupContent />
    </ProtectedDashboard>
  );
}