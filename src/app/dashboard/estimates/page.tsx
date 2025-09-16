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
  Eye,
  Send,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useEstimates, useEstimateStats } from "@/lib/hooks/useEstimates";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedDashboard from "@/components/ProtectedDashboard";

function EstimatesContent() {
  const { data: estimates, error: estimatesError, isLoading: estimatesLoading } = useEstimates();
  const { data: stats, isLoading: statsLoading } = useEstimateStats();

  if (estimatesLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="px-6 py-6 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading estimates...</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (estimatesError) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="px-6 py-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-red-800">Error Loading Estimates</h3>
              <p className="text-sm text-red-600 mt-1">{estimatesError.message}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-purple-100 text-purple-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      case 'converted': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'sent': return <Send className="h-3 w-3" />;
      case 'viewed': return <Eye className="h-3 w-3" />;
      case 'draft': return <FileText className="h-3 w-3" />;
      case 'rejected': return <AlertCircle className="h-3 w-3" />;
      case 'expired': return <Clock className="h-3 w-3" />;
      case 'converted': return <CheckCircle className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Estimates</h1>
              <p className="text-gray-600">Create and manage customer estimates and quotes</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Link href="/dashboard/estimates/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Estimate
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
                placeholder="Search estimates by number, customer, or title..."
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
                <CardTitle className="text-sm font-medium">Total Estimates</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : (stats?.total_estimates || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statsLoading ? 'Loading...' : `${stats?.approved || 0} approved, ${stats?.pending || 0} pending`}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : (stats?.pending || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting customer response
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
                  {statsLoading ? '...' : `SLL ${(stats?.total_value || 0).toLocaleString()}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  All estimates combined
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : `${(stats?.conversion_rate || 0).toFixed(1)}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Estimates to jobs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Estimates List */}
          <Card>
            <CardHeader>
              <CardTitle>All Estimates</CardTitle>
              <CardDescription>Customer estimates and quotes management</CardDescription>
            </CardHeader>
            <CardContent>
              {!estimates || estimates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No estimates found</h3>
                  <p className="text-gray-600 mb-4">Get started by creating your first customer estimate</p>
                  <Link href="/dashboard/estimates/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Estimate
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {estimates.map((estimate) => (
                    <div key={estimate.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{estimate.title}</h3>
                            <Badge className={getStatusColor(estimate.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(estimate.status)}
                                <span>{estimate.status.replace('_', ' ')}</span>
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {estimate.estimate_number} • {estimate.customer_name}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {estimate.customer_name}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Created: {new Date(estimate.created_at).toLocaleDateString('en-SL')}
                            </div>
                            {estimate.expires_at && (
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Expires: {new Date(estimate.expires_at).toLocaleDateString('en-SL')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            SLL {estimate.total_amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {estimate.quantity} × SLL {(estimate.unit_price || 0).toLocaleString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/estimates/${estimate.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Link>
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
export default function EstimatesPage() {
  return (
    <ProtectedDashboard allowedRoles={['super_admin', 'admin', 'manager', 'staff']}>
      <EstimatesContent />
    </ProtectedDashboard>
  );
}