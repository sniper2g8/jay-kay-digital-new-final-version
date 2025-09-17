'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { useCustomerData } from '@/lib/hooks/useCustomerData';
import { formatCurrency } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Clock, CheckCircle, AlertCircle, User, Mail, DollarSign, Package, Loader2, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function CustomerDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: userData, isLoading: roleLoading, error: roleError } = useUserRole();
  const { jobs, invoices, stats, loading: dataLoading, error: dataError, refreshData } = useCustomerData();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (roleError) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Access Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">
              There was an error loading your account information. This might be because:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600">
              <li>Your account is still being set up</li>
              <li>You don&apos;t have the required permissions</li>
              <li>There&apos;s a temporary system issue</li>
            </ul>
            <div className="mt-4 space-x-2">
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Link href="/auth/login">
                <Button variant="outline">
                  Login Again
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userRole = userData?.primary_role || 'customer';
  const userName = userData?.name || user.email?.split('@')[0] || 'User';

  // Format currency using the shared formatCurrency function

  // Format date using Sierra Leone locale
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-SL');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {userName}!</h1>
          <p className="text-gray-600">Manage your printing orders and account</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={userRole === 'customer' ? 'default' : 'secondary'} className="text-sm">
            {userRole.replace('_', ' ').toUpperCase()}
          </Badge>
          <Button onClick={refreshData} variant="outline" size="sm">
            Refresh Data
          </Button>
          <Button onClick={handleLogout} variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Customer ID</p>
                <p className="font-medium">{userData?.human_id || 'Not assigned'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium text-green-600">{userData?.status || 'Active'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeJobs} active, {stats.completedJobs} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dataLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dataLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatCurrency(stats.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              Paid invoices total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dataLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.pendingInvoices}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-500" />
              New Order
            </CardTitle>
            <CardDescription>
              Upload files and create a new printing order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Start New Order
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              My Orders
            </CardTitle>
            <CardDescription>
              View and track your printing orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              View All ({stats.totalJobs})
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Track Order
            </CardTitle>
            <CardDescription>
              Check the status of your current orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Track Progress ({stats.activeJobs})
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              Invoices
            </CardTitle>
            <CardDescription>
              View and download your invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              View Invoices ({invoices.length})
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
          <CardDescription>
            Your most recent printing orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading your jobs...</span>
            </div>
          ) : dataError ? (
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Error loading jobs: {dataError}</p>
              <Button onClick={refreshData} variant="outline" size="sm" className="mt-2">
                Try Again
              </Button>
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{job.title || `Job ${job.jobNo}`}</h4>
                      <p className="text-sm text-gray-500">
                        {job.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      job.status === 'completed' ? 'default' :
                      job.status === 'in_progress' ? 'secondary' : 'outline'
                    }>
                      {job.status || 'Unknown'}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {formatDate(job.dueDate as string)}
                    </p>
                  </div>
                </div>
              ))}
              {jobs.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    View All {jobs.length} Jobs
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No jobs yet</p>
              <p className="text-sm">Your printing orders will appear here</p>
              <Button className="mt-4">
                <Upload className="h-4 w-4 mr-2" />
                Create Your First Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>
            Your invoices and payment status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading your invoices...</span>
            </div>
          ) : invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Invoice {invoice.invoiceNo}</h4>
                      <p className="text-sm text-gray-500">
                        Created: {formatDate(invoice.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(invoice.grandTotal || invoice.total || 0)}
                    </p>
                    <Badge variant={
                      invoice.status === 'paid' ? 'default' :
                      invoice.status === 'overdue' ? 'destructive' : 'secondary'
                    }>
                      {invoice.status || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              ))}
              {invoices.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    View All {invoices.length} Invoices
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No invoices yet</p>
              <p className="text-sm">Your invoices will appear here once jobs are completed</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}