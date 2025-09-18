"use client";

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
import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  Printer,
  Loader2,
  X,
  QrCode,
} from "lucide-react";
import Link from "next/link";
import { useJobsWithCustomers, useJobStats } from "@/lib/hooks/useJobs";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedDashboard from "@/components/ProtectedDashboard";

interface JobFilters {
  search: string;
  status: string;
  priority: string;
  customer: string;
  dateFrom: string;
  dateTo: string;
  assignedTo: string;
}

function JobsContent() {
  const {
    data: jobs,
    error: jobsError,
    isLoading: jobsLoading,
  } = useJobsWithCustomers();
  const { data: stats, isLoading: statsLoading } = useJobStats();

  // Filter states
  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    status: '',
    priority: '',
    customer: '',
    dateFrom: '',
    dateTo: '',
    assignedTo: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for filter dropdowns
  const uniqueCustomers = useMemo(() => {
    if (!jobs) return [];
    const customers = [...new Set(jobs.map(job => job.customer_name).filter(Boolean))];
    return customers.sort();
  }, [jobs]);

  const uniqueAssignees = useMemo(() => {
    if (!jobs) return [];
    const assignees = [...new Set(jobs.map(job => job.assigned_to).filter(Boolean))];
    return assignees.sort();
  }, [jobs]);

  // Filter jobs based on current filters
  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    
    return jobs.filter(job => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableFields = [
          job.jobNo,
          job.title,
          job.customer_name,
          job.description
        ].filter(Boolean).map(field => field?.toLowerCase());
        
        if (!searchableFields.some(field => field?.includes(searchTerm))) {
          return false;
        }
      }

      // Status filter
      if (filters.status && job.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority && job.priority !== filters.priority) {
        return false;
      }

      // Customer filter
      if (filters.customer && job.customer_name !== filters.customer) {
        return false;
      }

      // Assigned to filter
      if (filters.assignedTo && job.assigned_to !== filters.assignedTo) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const jobDate = new Date(job.created_at || '');
        if (filters.dateFrom && jobDate < new Date(filters.dateFrom)) {
          return false;
        }
        if (filters.dateTo && jobDate > new Date(filters.dateTo + 'T23:59:59')) {
          return false;
        }
      }

      return true;
    });
  }, [jobs, filters]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      customer: '',
      dateFrom: '',
      dateTo: '',
      assignedTo: ''
    });
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  if (jobsLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="px-6 py-6 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading jobs...</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (jobsError) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="px-6 py-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-red-800">
                Error Loading Jobs
              </h3>
              <p className="text-sm text-red-600 mt-1">{jobsError.message}</p>
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
                Job Management
              </h1>
              <p className="text-gray-600">
                Track and manage all printing jobs from quote to delivery
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Link href="/dashboard/submit-job">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Job
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-6">
          <div className="space-y-4 mb-6">
            {/* Main Search and Filter Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by job number, customer, title, or description..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <Button 
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={hasActiveFilters ? "border-blue-500 text-blue-600" : ""}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter {hasActiveFilters && `(${Object.values(filters).filter(v => v !== '').length})`}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Priority</Label>
                    <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Customer Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Customer</Label>
                    <Select value={filters.customer} onValueChange={(value) => setFilters(prev => ({ ...prev, customer: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Customers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Customers</SelectItem>
                        {uniqueCustomers.map(customer => (
                          <SelectItem key={customer} value={customer || ''}>{customer}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date From */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">From Date</Label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    />
                  </div>

                  {/* Date To */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">To Date</Label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    />
                  </div>

                  {/* Assigned To Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Assigned To</Label>
                    <Select value={filters.assignedTo} onValueChange={(value) => setFilters(prev => ({ ...prev, assignedTo: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Assignees" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Assignees</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {uniqueAssignees.map(assignee => (
                          <SelectItem key={assignee} value={assignee || ''}>{assignee}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Filter Summary */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Showing {filteredJobs.length} of {jobs?.length || 0} jobs</span>
                    <div className="flex items-center space-x-4">
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Jobs
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.total_jobs || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statsLoading
                    ? "Loading..."
                    : `${stats?.completed || 0} completed, ${stats?.in_progress || 0} active`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  In Progress
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.in_progress || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently being worked on
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Value
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading
                    ? "..."
                    : `SLL ${(stats?.total_value || 0).toLocaleString()}`}
                </div>
                <p className="text-xs text-muted-foreground">All active jobs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Job Value
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading
                    ? "..."
                    : `SLL ${Math.round(stats?.avg_job_value || 0).toLocaleString()}`}
                </div>
                <p className="text-xs text-muted-foreground">Per job average</p>
              </CardContent>
            </Card>
          </div>

          {/* Job List */}
          <Card>
            <CardHeader>
              <CardTitle>All Jobs</CardTitle>
              <CardDescription>
                Complete list of printing jobs with human-readable tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!filteredJobs || filteredJobs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {hasActiveFilters ? 'No jobs match your filters' : 'No jobs found'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {hasActiveFilters 
                      ? 'Try adjusting your filters to see more results' 
                      : 'Get started by creating your first printing job'
                    }
                  </p>
                  {hasActiveFilters ? (
                    <Button variant="outline" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  ) : (
                    <Link href="/dashboard/submit-job">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Job
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJobs.map((job) => {
                    // Helper functions for status and priority colors
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case "completed":
                          return "bg-green-100 text-green-800";
                        case "in_progress":
                          return "bg-blue-100 text-blue-800";
                        case "pending":
                          return "bg-yellow-100 text-yellow-800";
                        case "cancelled":
                          return "bg-red-100 text-red-800";
                        default:
                          return "bg-gray-100 text-gray-800";
                      }
                    };

                    const getPriorityColor = (priority: string) => {
                      switch (priority) {
                        case "urgent":
                          return "border-red-500 text-red-700";
                        case "high":
                          return "border-orange-500 text-orange-700";
                        case "medium":
                          return "border-blue-500 text-blue-700";
                        case "low":
                          return "border-gray-500 text-gray-700";
                        default:
                          return "border-gray-500 text-gray-700";
                      }
                    };

                    const getStatusIcon = (status: string) => {
                      switch (status) {
                        case "completed":
                          return <CheckCircle className="h-3 w-3" />;
                        case "in_progress":
                          return <Clock className="h-3 w-3" />;
                        case "pending":
                          return <AlertCircle className="h-3 w-3" />;
                        default:
                          return <FileText className="h-3 w-3" />;
                      }
                    };

                    return (
                      <div
                        key={job.id || job.jobNo}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 p-3 rounded-lg">
                            <Printer className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {job.title || "Untitled Job"}
                              </h3>
                              <Badge
                                className={getStatusColor(
                                  job.status || "pending",
                                )}
                              >
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(job.status || "pending")}
                                  <span>
                                    {(job.status || "pending").replace(
                                      "_",
                                      " ",
                                    )}
                                  </span>
                                </div>
                              </Badge>
                              <Badge
                                variant="outline"
                                className={getPriorityColor(
                                  job.priority || "medium",
                                )}
                              >
                                {job.priority || "medium"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {job.jobNo || "No Job #"} •{" "}
                              {job.customer_name || "Unknown Customer"}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {job.assigned_to || "Unassigned"}
                              </div>
                              {job.estimated_delivery && (
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Due:{" "}
                                  {typeof job.estimated_delivery === "string"
                                    ? new Date(job.estimated_delivery).toLocaleDateString(
                                        "en-SL",
                                      )
                                    : "TBD"}
                                </div>
                              )}
                              <div>
                                Qty: {job.quantity?.toLocaleString() || "N/A"}
                              </div>
                              <div>Print Details Available</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              SLL{" "}
                              {(
                                job.final_price ||
                                job.estimate_price ||
                                0
                              ).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              SLL{" "}
                              {(
                                job.unit_price ||
                                (job.final_price || 0) / (job.quantity || 1)
                              ).toFixed(2)}
                              /unit
                            </p>
                            {job.estimate_price &&
                              job.final_price &&
                              job.estimate_price !== job.final_price && (
                                <p className="text-xs text-blue-600">
                                  Final: SLL {job.final_price.toLocaleString()}
                                </p>
                              )}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const url = `${window.location.origin}/track/${job.jobNo || job.id}`;
                                navigator.clipboard.writeText(url);
                                // You could add a toast notification here
                              }}
                              title="Copy tracking link"
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/dashboard/jobs/${job.jobNo || job.id}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
export default function JobsPage() {
  return (
    <ProtectedDashboard
      allowedRoles={["super_admin", "admin", "manager", "staff"]}
    >
      <JobsContent />
    </ProtectedDashboard>
  );
}
