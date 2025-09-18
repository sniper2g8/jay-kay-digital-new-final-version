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
import {
  Users,
  FileText,
  TrendingUp,
  Calendar,
  DollarSign,
  Plus,
  Eye,
  BarChart3,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useJobStats } from "@/lib/hooks/useJobs";
import { useFinancialStats } from "@/lib/hooks/useFinances";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedDashboard from "@/components/ProtectedDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/constants";

function DashboardContent() {
  const { user, session, loading: authLoading } = useAuth();

  // Only call hooks if we're sure the user is authenticated
  const shouldFetchData = user && session && !authLoading;

  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: jobStats, isLoading: jobStatsLoading } = useJobStats();
  const { data: financialStats, isLoading: financialStatsLoading } =
    useFinancialStats();

  // Show loading state while authentication is being determined
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Authentication Required
            </h2>
            <p className="text-muted-foreground mb-6">
              Please log in to access the dashboard.
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/auth/login">Go to Login</Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Welcome back, {user?.user_metadata?.name || "User"}
              </h1>
              <p className="text-muted-foreground mt-1">
                Here&apos;s what&apos;s happening with your printing operations
                today.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 w-fit">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                System Operational
              </Badge>
              <Button
                asChild
                className="shadow-sm hover:shadow-md transition-shadow bg-primary hover:bg-primary/90"
              >
                <Link href="/dashboard/submit-job">
                  <Plus className="h-4 w-4 mr-2" />
                  New Job
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover-lift transition-all border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {jobStatsLoading ? "..." : jobStats?.total_jobs || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {jobStats?.completed || 0} completed,{" "}
                {jobStats?.in_progress || 0} active
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift transition-all border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Customers
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {customersLoading ? "..." : customers?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Registered customers
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift transition-all border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {financialStatsLoading
                  ? "..."
                  : formatCurrency(financialStats?.total_revenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {financialStats?.collection_rate || 0}% collection rate
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift transition-all border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Job Completion
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {jobStatsLoading
                  ? "..."
                  : `${Math.round(((jobStats?.completed || 0) / Math.max(jobStats?.total_jobs || 1, 1)) * 100)}%`}
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/dashboard/customers">
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 w-full hover-lift border-black text-black hover:bg-gray-100"
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Manage Customers</span>
                  </Button>
                </Link>

                <Link href="/dashboard/jobs">
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 w-full hover-lift border-black text-black hover:bg-gray-100"
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-sm">View Jobs</span>
                  </Button>
                </Link>

                <Link href="/dashboard/statements">
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 w-full hover-lift border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-sm">Statements</span>
                  </Button>
                </Link>

                <Link href="/dashboard/invoices">
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 w-full hover-lift border-black text-black hover:bg-gray-100"
                  >
                    <Calendar className="h-6 w-6" />
                    <span className="text-sm">Invoices</span>
                  </Button>
                </Link>

                <Link href="/dashboard/submit-job">
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 w-full hover-lift border-black text-black hover:bg-gray-100"
                  >
                    <Plus className="h-6 w-6" />
                    <span className="text-sm">New Job</span>
                  </Button>
                </Link>

                <Link href="/dashboard/analytics">
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 w-full hover-lift border-black text-black hover:bg-gray-100"
                  >
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm">Reports</span>
                  </Button>
                </Link>

                <Link href="/dashboard/payments">
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 w-full hover-lift border-black text-black hover:bg-gray-100"
                  >
                    <DollarSign className="h-6 w-6" />
                    <span className="text-sm">Payments</span>
                  </Button>
                </Link>

                <Link href="/job-board" target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 w-full hover-lift border-green-500 text-green-600 hover:bg-green-50"
                  >
                    <Eye className="h-6 w-6" />
                    <span className="text-sm">Job Board</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system updates</CardDescription>
            </CardHeader>
            <CardContent>
              {jobStatsLoading || customersLoading || financialStatsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-primary"></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        New job submitted
                      </p>
                      <p className="text-xs text-muted-foreground">
                        2 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-primary"></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Payment received
                      </p>
                      <p className="text-xs text-muted-foreground">
                        5 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-primary"></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Job completed
                      </p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-primary"></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        New customer registered
                      </p>
                      <p className="text-xs text-muted-foreground">
                        2 days ago
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/dashboard/customers">
            <Card className="hover-lift transition-all cursor-pointer border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Customer Management</CardTitle>
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardDescription>
                  Manage customer relationships, track contact information, and
                  view customer history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary">
                    {customersLoading ? "..." : customers?.length || 0}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover-lift hover:bg-primary/10"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/jobs">
            <Card className="hover-lift transition-all cursor-pointer border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Job Tracking</CardTitle>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <CardDescription>
                  Track printing jobs from order to completion with real-time
                  status updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary">
                    {jobStatsLoading ? "..." : jobStats?.total_jobs || 0}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover-lift hover:bg-primary/10"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/finances">
            <Card className="hover-lift transition-all cursor-pointer border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Financial Overview</CardTitle>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
                <CardDescription>
                  Monitor revenue, track payments, and generate financial
                  reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary">
                    {financialStatsLoading
                      ? "..."
                      : formatCurrency(financialStats?.total_revenue || 0)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover-lift hover:bg-primary/10"
                  >
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

// Main component with role-based protection
export default function DashboardPage() {
  return (
    <ProtectedDashboard
      allowedRoles={["super_admin", "admin", "manager", "staff", "customer"]}
    >
      <DashboardContent />
    </ProtectedDashboard>
  );
}
