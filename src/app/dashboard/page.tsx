'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Plus,
  Eye,
  BarChart3,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useJobStats } from "@/lib/hooks/useJobs";
import { useFinancialStats } from "@/lib/hooks/useFinances";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { user, session, loading: authLoading } = useAuth();
  
  // Only call hooks if we're sure the user is authenticated
  const shouldFetchData = user && session && !authLoading;
  
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: jobStats, isLoading: jobStatsLoading } = useJobStats();
  const { data: financialStats, isLoading: financialStatsLoading } = useFinancialStats();

  console.log('Dashboard - Auth state:', { 
    hasUser: !!user, 
    hasSession: !!session, 
    authLoading,
    shouldFetchData 
  });

  // Show loading state while authentication is being determined
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading dashboard...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show message if not authenticated
  if (!user || !session) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please log in to access the dashboard.</p>
            <Button onClick={() => window.location.href = '/auth/login'}>
              Go to Login
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <div className="px-6 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Dashboard Overview
              </h2>
              <p className="text-gray-600">
                Here&apos;s what&apos;s happening with your printing operations today.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-green-100 text-green-800">
                System Operational
              </Badge>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Job
              </Button>
            </div>
          </div>
        </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {jobStatsLoading ? '...' : (jobStats?.total_jobs || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {jobStats?.completed || 0} completed, {jobStats?.in_progress || 0} active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customersLoading ? '...' : (customers?.length || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registered customers
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {financialStatsLoading ? '...' : `$${(financialStats?.total_revenue || 0).toLocaleString()}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  {financialStats?.collection_rate || 0}% collection rate
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Job Completion</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {jobStatsLoading ? '...' : `${Math.round((jobStats?.completed || 0) / Math.max(jobStats?.total_jobs || 1, 1) * 100)}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  +2.1% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Link href="/dashboard/customers">
                    <Button variant="outline" className="h-20 flex-col space-y-2 w-full">
                      <Users className="h-6 w-6" />
                      <span className="text-sm">Manage Customers</span>
                    </Button>
                  </Link>
                  
                  <Link href="/dashboard/jobs">
                    <Button variant="outline" className="h-20 flex-col space-y-2 w-full">
                      <FileText className="h-6 w-6" />
                      <span className="text-sm">View Jobs</span>
                    </Button>
                  </Link>
                  
                  <Link href="/dashboard/invoices">
                    <Button variant="outline" className="h-20 flex-col space-y-2 w-full">
                      <Calendar className="h-6 w-6" />
                      <span className="text-sm">Invoices</span>
                    </Button>
                  </Link>
                  
                  <Button variant="outline" className="h-20 flex-col space-y-2 w-full">
                    <Plus className="h-6 w-6" />
                    <span className="text-sm">New Job</span>
                  </Button>
                  
                  <Button variant="outline" className="h-20 flex-col space-y-2 w-full">
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm">Reports</span>
                  </Button>
                  
                  <Button variant="outline" className="h-20 flex-col space-y-2 w-full">
                    <DollarSign className="h-6 w-6" />
                    <span className="text-sm">Payments</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Job JKDP-JOB-1045 completed</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New customer registered</p>
                      <p className="text-xs text-gray-500">15 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Payment received</p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Inventory updated</p>
                      <p className="text-xs text-gray-500">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/dashboard/customers">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Customer Management</CardTitle>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardDescription>
                    Manage customer relationships, track contact information, and view customer history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-blue-600">
                      {customersLoading ? '...' : (customers?.length || 0)}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/jobs">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Job Tracking</CardTitle>
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                  <CardDescription>
                    Track printing jobs from order to completion with real-time status updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-green-600">
                      {jobStatsLoading ? '...' : (jobStats?.total_jobs || 0)}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/finances">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Financial Overview</CardTitle>
                    <DollarSign className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardDescription>
                    Monitor revenue, track payments, and generate financial reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-purple-600">
                      {financialStatsLoading ? '...' : `$${(financialStats?.total_revenue || 0).toLocaleString()}`}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
      </div>
    </DashboardLayout>
  );
}
