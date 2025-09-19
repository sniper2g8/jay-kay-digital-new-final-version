"use client";

import {  useState, useEffect  } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Activity,
  PieChart,
  LineChart,
  Target,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database-generated.types";

type Job = Database["public"]["Tables"]["jobs"]["Row"];
type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Payment = {
  amount: number | null;
  payment_date: string | null;
  payment_method: string | null;
};

// Type for inventory movements (if not in database types)
interface InventoryMovement {
  inventory_id: string;
  [key: string]: unknown;
}

// Chart components (simplified for now)
const SimpleBarChart = ({
  data,
  title,
}: {
  data: Array<{ label: string; value: number }>;
  title: string;
}) => (
  <div className="space-y-2">
    <h4 className="text-sm font-medium text-gray-600">{title}</h4>
    <div className="space-y-1">
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{item.label}</span>
          <div className="flex items-center gap-2">
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${(item.value / Math.max(...data.map((d) => d.value))) * 100}%`,
                }}
              ></div>
            </div>
            <span className="text-sm font-medium w-16 text-right">
              {item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SimpleLineChart = ({
  data,
  title,
}: {
  data: Array<{ label: string; value: number }>;
  title: string;
}) => (
  <div className="space-y-2">
    <h4 className="text-sm font-medium text-gray-600">{title}</h4>
    <div className="h-32 flex items-end justify-between space-x-1">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div
            className="w-full bg-blue-600 rounded-t"
            style={{
              height: `${(item.value / Math.max(...data.map((d) => d.value))) * 100}%`,
            }}
          ></div>
          <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  </div>
);

interface AnalyticsData {
  revenue: {
    totalRevenue: number;
    monthlyRevenue: number;
    revenueGrowth: number;
    monthlyRevenueData: Array<{ month: string; revenue: number }>;
  };
  jobs: {
    totalJobs: number;
    completedJobs: number;
    pendingJobs: number;
    jobCompletionRate: number;
    jobStatusData: Array<{ status: string; count: number }>;
    monthlyJobsData: Array<{ month: string; jobs: number }>;
  };
  customers: {
    totalCustomers: number;
    newCustomers: number;
    topCustomers: Array<{ name: string; totalSpent: number; jobCount: number }>;
    customerGrowthData: Array<{ month: string; customers: number }>;
  };
  inventory: {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    topMovingItems: Array<{ item: string; movements: number }>;
    inventoryValueData: Array<{ category: string; value: number }>;
  };
  financial: {
    totalPayments: number;
    pendingPayments: number;
    overduePayments: number;
    paymentMethodData: Array<{ method: string; amount: number }>;
    monthlyPaymentsData: Array<{ month: string; amount: number }>;
  };
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("last_30_days");
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    revenue: {
      totalRevenue: 0,
      monthlyRevenue: 0,
      revenueGrowth: 0,
      monthlyRevenueData: [],
    },
    jobs: {
      totalJobs: 0,
      completedJobs: 0,
      pendingJobs: 0,
      jobCompletionRate: 0,
      jobStatusData: [],
      monthlyJobsData: [],
    },
    customers: {
      totalCustomers: 0,
      newCustomers: 0,
      topCustomers: [],
      customerGrowthData: [],
    },
    inventory: {
      totalItems: 0,
      totalValue: 0,
      lowStockItems: 0,
      topMovingItems: [],
      inventoryValueData: [],
    },
    financial: {
      totalPayments: 0,
      pendingPayments: 0,
      overduePayments: 0,
      paymentMethodData: [],
      monthlyPaymentsData: [],
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchRevenueAnalytics(),
          fetchJobAnalytics(),
          fetchCustomerAnalytics(),
          fetchInventoryAnalytics(),
          fetchFinancialAnalytics(),
        ]);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchRevenueAnalytics(),
        fetchJobAnalytics(),
        fetchCustomerAnalytics(),
        fetchInventoryAnalytics(),
        fetchFinancialAnalytics(),
      ]);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueAnalytics = async () => {
    try {
      // Fetch total revenue from jobs and payments
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("final_price, created_at, status");

      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("amount, payment_date, payment_method");

      if (jobsError) throw jobsError;
      if (paymentsError) throw paymentsError;

      const totalRevenue = (jobsData || []).reduce(
        (sum: number, job) =>
          sum + (job.final_price || 0),
        0,
      );
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyRevenue = (paymentsData || []).reduce(
        (sum: number, payment: { payment_date?: string; amount?: number }) => {
          const paymentDate = new Date(payment.payment_date || "");
          if (
            paymentDate.getMonth() === currentMonth &&
            paymentDate.getFullYear() === currentYear
          ) {
            return sum + (payment.amount || 0);
          }
          return sum;
        },
        0,
      );

      // Generate monthly revenue data for the last 6 months
      const monthlyRevenueData: Array<{ month: string; revenue: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthPayments = (paymentsData || []).filter(
          (payment: { payment_date?: string; amount?: number }) => {
            const paymentDate = new Date(payment.payment_date || "");
            return (
              paymentDate.getMonth() === date.getMonth() &&
              paymentDate.getFullYear() === date.getFullYear()
            );
          },
        );

        monthlyRevenueData.push({
          month: date.toLocaleDateString("en-US", { month: "short" }),
          revenue: monthPayments.reduce(
            (sum: number, payment: { amount?: number }) =>
              sum + (payment.amount || 0),
            0,
          ),
        });
      }

      setAnalytics((prev) => ({
        ...prev,
        revenue: {
          totalRevenue,
          monthlyRevenue,
          revenueGrowth: 12.5, // Mock growth rate
          monthlyRevenueData,
        },
      }));
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
    }
  };

  const fetchJobAnalytics = async () => {
    try {
      const { data: jobsData, error } = await supabase
        .from("jobs")
        .select("status, created_at");

      if (error) throw error;

      const totalJobs = (jobsData || []).length;
      const completedJobs = (jobsData || []).filter(
        (job: { status: string | null }) => job.status === "completed",
      ).length;
      const pendingJobs = (jobsData || []).filter(
        (job: { status: string | null }) => job.status === "pending",
      ).length;
      const jobCompletionRate =
        totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

      // Job status distribution
      const statusCounts = (jobsData || []).reduce(
        (acc: Record<string, number>, job: { status: string | null }) => {
          const status = job.status || "unknown";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const jobStatusData = Object.entries(statusCounts).map(
        ([status, count]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1),
          count,
        }),
      );

      // Monthly jobs data
      const monthlyJobsData: Array<{ month: string; jobs: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthJobs = (jobsData || []).filter(
          (job: { created_at: string | null }) => {
            const jobDate = new Date(job.created_at || "");
            return (
              jobDate.getMonth() === date.getMonth() &&
              jobDate.getFullYear() === date.getFullYear()
            );
          },
        );

        monthlyJobsData.push({
          month: date.toLocaleDateString("en-US", { month: "short" }),
          jobs: monthJobs.length,
        });
      }

      setAnalytics((prev) => ({
        ...prev,
        jobs: {
          totalJobs,
          completedJobs,
          pendingJobs,
          jobCompletionRate,
          jobStatusData,
          monthlyJobsData,
        },
      }));
    } catch (error) {
      console.error("Error fetching job analytics:", error);
    }
  };

  const fetchCustomerAnalytics = async () => {
    try {
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("created_at, business_name, contact_person, id");

      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("customer_id, final_price");

      if (customersError) throw customersError;
      if (jobsError) throw jobsError;

      const totalCustomers = (customersData || []).length;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const newCustomers = (customersData || []).filter(
        (customer: { created_at: string | null }) => {
          const createdDate = new Date(customer.created_at || "");
          return (
            createdDate.getMonth() === currentMonth &&
            createdDate.getFullYear() === currentYear
          );
        },
      ).length;

      // Top customers by spending
      const customerSpending = (jobsData || []).reduce(
        (
          acc: Record<string, number>,
          job: { customer_id: string | null; final_price: number | null },
        ) => {
          if (job.customer_id) {
            acc[job.customer_id] =
              (acc[job.customer_id] || 0) + (job.final_price || 0);
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      const topCustomers = Object.entries(customerSpending)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([customerId, totalSpent]) => {
          const customer = (customersData || []).find(
            (c: { id: string }) => c.id === customerId,
          );
          const jobCount = (jobsData || []).filter(
            (j: { customer_id: string | null }) => j.customer_id === customerId,
          ).length;
          return {
            name:
              customer?.business_name ||
              customer?.contact_person ||
              "Unknown Customer",
            totalSpent,
            jobCount,
          };
        });

      setAnalytics((prev) => ({
        ...prev,
        customers: {
          totalCustomers,
          newCustomers,
          topCustomers,
          customerGrowthData: [], // Mock data
        },
      }));
    } catch (error) {
      console.error("Error fetching customer analytics:", error);
    }
  };

  const fetchInventoryAnalytics = async () => {
    try {
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select(
          "id, current_stock, unit_cost, minimum_stock, category, item_name, status",
        );

      const { data: movementsData, error: movementsError } = await supabase
        .from("inventory_movements")
        .select("inventory_id, quantity, movement_type");

      if (inventoryError) throw inventoryError;
      if (movementsError) throw movementsError;

      const inventoryItems = inventoryData || [];

      const totalItems = inventoryItems.length;
      const totalValue = inventoryItems.reduce(
        (sum, item) => sum + (item.current_stock || 0) * (item.unit_cost || 0),
        0,
      );

      const lowStockItems = inventoryItems.filter(
        (item) =>
          (item.current_stock || 0) <= (item.minimum_stock || 0),
      ).length;

      // Top moving items
      const itemMovements = (
        (movementsData || []) as Array<{ inventory_id: string }>
      ).reduce(
        (acc, movement) => {
          acc[movement.inventory_id || ""] =
            (acc[movement.inventory_id || ""] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const topMovingItems = Object.entries(itemMovements)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([inventoryId, movements]) => {
          const item = inventoryItems.find((i) => i.id === inventoryId);
          return {
            item: item?.item_name || "Unknown Item",
            movements: movements as number,
          };
        });

      // Inventory value by category
      const categoryValues = (inventoryData || []).reduce(
        (acc, item) => {
          const category = item.category || "Uncategorized";
          const value = (item.current_stock || 0) * (item.unit_cost || 0);
          acc[category] = (acc[category] || 0) + value;
          return acc;
        },
        {} as Record<string, number>,
      );

      const inventoryValueData = Object.entries(categoryValues).map(
        ([category, value]) => ({
          category,
          value: value as number,
        }),
      );

      setAnalytics((prev) => ({
        ...prev,
        inventory: {
          totalItems,
          totalValue,
          lowStockItems,
          topMovingItems,
          inventoryValueData,
        },
      }));
    } catch (error) {
      console.error("Error fetching inventory analytics:", error);
    }
  };

  const fetchFinancialAnalytics = async () => {
    try {
      const { data: paymentsData, error } = await supabase
        .from("payments")
        .select("amount, payment_date, payment_method");

      if (error) throw error;

      const totalPayments = (paymentsData || []).reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0,
      );

      // For now, we'll use mock data for pending/overdue since we don't have status field
      const pendingPayments = 0; // Mock data
      const overduePayments = 0; // Mock data

      // Payment method distribution
      const paymentMethods = (paymentsData || []).reduce(
        (acc, payment: { payment_method?: string; amount?: number }) => {
          const method = payment.payment_method || "Unknown";
          acc[method] = (acc[method] || 0) + (payment.amount || 0);
          return acc;
        },
        {} as Record<string, number>,
      );

      const paymentMethodData = Object.entries(paymentMethods).map(
        ([method, amount]) => ({
          method: method.charAt(0).toUpperCase() + method.slice(1),
          amount: amount as number,
        }),
      );

      setAnalytics((prev) => ({
        ...prev,
        financial: {
          totalPayments,
          pendingPayments,
          overduePayments,
          paymentMethodData,
          monthlyPaymentsData: [], // Mock data
        },
      }));
    } catch (error) {
      console.error("Error fetching financial analytics:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SL", {
      style: "currency",
      currency: "SLL",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive business insights and performance metrics
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="last_90_days">Last 90 Days</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics.revenue.totalRevenue)}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>
                {formatPercentage(analytics.revenue.revenueGrowth)} from last
                month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Job Completion
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatPercentage(analytics.jobs.jobCompletionRate)}
            </div>
            <p className="text-xs text-gray-500">
              {analytics.jobs.completedJobs} of {analytics.jobs.totalJobs} jobs
              completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analytics.customers.totalCustomers}
            </div>
            <p className="text-xs text-gray-500">
              +{analytics.customers.newCustomers} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inventory Value
            </CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(analytics.inventory.totalValue)}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              <span>{analytics.inventory.lowStockItems} items low stock</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Monthly Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleLineChart
                  data={analytics.revenue.monthlyRevenueData.map((item) => ({
                    label: item.month,
                    value: item.revenue,
                  }))}
                  title="Revenue by Month"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Job Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleBarChart
                  data={analytics.jobs.jobStatusData.map((item) => ({
                    label: item.status,
                    value: item.count,
                  }))}
                  title="Jobs by Status"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Top Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.customers.topCustomers.map((customer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-500">
                          {customer.jobCount} jobs
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {formatCurrency(customer.totalSpent)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-green-800">
                      Total Payments
                    </span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(analytics.financial.totalPayments)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="font-medium text-yellow-800">Pending</span>
                    <span className="font-bold text-yellow-600">
                      {formatCurrency(analytics.financial.pendingPayments)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium text-red-800">Overdue</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(analytics.financial.overduePayments)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly revenue performance</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleLineChart
                  data={analytics.revenue.monthlyRevenueData.map((item) => ({
                    label: item.month,
                    value: item.revenue,
                  }))}
                  title="6-Month Revenue Trend"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Revenue by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart
                  data={analytics.financial.paymentMethodData.map((item) => ({
                    label: item.method,
                    value: item.amount,
                  }))}
                  title="Payment Distribution"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Volume Trends</CardTitle>
                <CardDescription>Monthly job creation trends</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleLineChart
                  data={analytics.jobs.monthlyJobsData.map((item) => ({
                    label: item.month,
                    value: item.jobs,
                  }))}
                  title="Jobs Created Per Month"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Performance Metrics</CardTitle>
                <CardDescription>Key job statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Completion Rate</span>
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800"
                    >
                      {formatPercentage(analytics.jobs.jobCompletionRate)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Jobs</span>
                    <span className="font-bold">
                      {analytics.jobs.totalJobs}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Completed</span>
                    <span className="font-bold text-green-600">
                      {analytics.jobs.completedJobs}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pending</span>
                    <span className="font-bold text-yellow-600">
                      {analytics.jobs.pendingJobs}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Customers by Revenue</CardTitle>
                <CardDescription>Highest spending customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.customers.topCustomers.map((customer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500">
                            {customer.jobCount} jobs
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {formatCurrency(customer.totalSpent)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Metrics</CardTitle>
                <CardDescription>Customer base analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {analytics.customers.totalCustomers}
                    </div>
                    <div className="text-blue-800 font-medium">
                      Total Customers
                    </div>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {analytics.customers.newCustomers}
                    </div>
                    <div className="text-green-800 font-medium">
                      New This Month
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Value by Category</CardTitle>
                <CardDescription>Stock value distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart
                  data={analytics.inventory.inventoryValueData.map((item) => ({
                    label: item.category,
                    value: item.value,
                  }))}
                  title="Value by Category"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Moving Items</CardTitle>
                <CardDescription>Most active inventory items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.inventory.topMovingItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{item.item}</span>
                      </div>
                      <Badge variant="outline">
                        {item.movements} movements
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
