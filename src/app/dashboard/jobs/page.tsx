'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useJobsWithCustomers, useJobStats } from "@/lib/hooks/useJobs";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedDashboard from "@/components/ProtectedDashboard";

function JobsContent() {
  const { data: jobs, error: jobsError, isLoading: jobsLoading } = useJobsWithCustomers();
  const { data: stats, isLoading: statsLoading } = useJobStats();

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
              <h3 className="text-lg font-medium text-red-800">Error Loading Jobs</h3>
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
              <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
              <p className="text-gray-600">Track and manage all printing jobs from quote to delivery</p>
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
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search jobs by number, customer, or description..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : (stats?.total_jobs || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statsLoading ? 'Loading...' : `${stats?.completed || 0} completed, ${stats?.in_progress || 0} active`}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : (stats?.in_progress || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently being worked on
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : `$${(stats?.total_value || 0).toLocaleString()}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  All active jobs
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Job Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : `$${Math.round(stats?.avg_job_value || 0)}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per job average
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Job List */}
          <Card>
            <CardHeader>
              <CardTitle>All Jobs</CardTitle>
              <CardDescription>Complete list of printing jobs with human-readable tracking</CardDescription>
            </CardHeader>
            <CardContent>
              {!jobs || jobs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-600 mb-4">Get started by creating your first printing job</p>
                  <Link href="/dashboard/submit-job">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Job
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => {
                    // Helper functions for status and priority colors
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'completed': return 'bg-green-100 text-green-800';
                        case 'in_progress': return 'bg-blue-100 text-blue-800';
                        case 'pending': return 'bg-yellow-100 text-yellow-800';
                        case 'cancelled': return 'bg-red-100 text-red-800';
                        default: return 'bg-gray-100 text-gray-800';
                      }
                    };

                    const getPriorityColor = (priority: string) => {
                      switch (priority) {
                        case 'urgent': return 'border-red-500 text-red-700';
                        case 'high': return 'border-orange-500 text-orange-700';
                        case 'medium': return 'border-blue-500 text-blue-700';
                        case 'low': return 'border-gray-500 text-gray-700';
                        default: return 'border-gray-500 text-gray-700';
                      }
                    };

                    const getStatusIcon = (status: string) => {
                      switch (status) {
                        case 'completed': return <CheckCircle className="h-3 w-3" />;
                        case 'in_progress': return <Clock className="h-3 w-3" />;
                        case 'pending': return <AlertCircle className="h-3 w-3" />;
                        default: return <FileText className="h-3 w-3" />;
                      }
                    };

                    return (
                      <div key={job.id || job.jobNo} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 p-3 rounded-lg">
                            <Printer className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{job.title || 'Untitled Job'}</h3>
                              <Badge className={getStatusColor(job.status || 'pending')}>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(job.status || 'pending')}
                                  <span>{(job.status || 'pending').replace('_', ' ')}</span>
                                </div>
                              </Badge>
                              <Badge variant="outline" className={getPriorityColor(job.priority || 'medium')}>
                                {job.priority || 'medium'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {job.jobNo || 'No Job #'} • {job.customer_name || 'Unknown Customer'}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {job.assigned_to || 'Unassigned'}
                              </div>
                              {job.dueDate && (
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Due: {typeof job.dueDate === 'string' ? new Date(job.dueDate).toLocaleDateString() : 'TBD'}
                                </div>
                              )}
                              <div>
                                Qty: {job.quantity?.toLocaleString() || 'N/A'}
                              </div>
                              <div>
                                Print Details Available
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ${(job.final_cost || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              ${((job.final_cost || 0) / (job.quantity || 1)).toFixed(2)}/unit
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/jobs/${job.jobNo || job.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
            </div>)}
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
    <ProtectedDashboard allowedRoles={['super_admin', 'admin', 'manager', 'staff']}>
      <JobsContent />
    </ProtectedDashboard>
  );
}
