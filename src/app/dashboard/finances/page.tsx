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
  DollarSign,
  FileText,
  CreditCard,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Download,
  Eye
} from "lucide-react";
import Link from "next/link";
import { useInvoicesWithCustomers, usePaymentsWithCustomers, useFinancialStats } from '@/lib/hooks/useFinances';

const getInvoiceStatusColor = (status: string | null) => {
  switch (status) {
    case "paid": return "bg-green-100 text-green-800";
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "overdue": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case "credit_card": return <CreditCard className="h-4 w-4" />;
    case "bank_transfer": return <FileText className="h-4 w-4" />;
    case "cash": return <DollarSign className="h-4 w-4" />;
    default: return <DollarSign className="h-4 w-4" />;
  }
};

export default function FinancesPage() {
  const { data: invoices = [] } = useInvoicesWithCustomers();
  const { data: payments = [] } = usePaymentsWithCustomers();
  const { data: stats } = useFinancialStats();

  // Calculate totals from live data
  const totalRevenue = stats?.total_revenue || 0;
  const totalPaid = stats?.total_paid || 0;
  const totalPending = stats?.total_pending || 0;
  const collectionRate = stats?.collection_rate || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
            <p className="text-gray-600">Track invoices, payments, and financial performance</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by invoice number, customer, or amount..."
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.total_invoices || 0} invoices total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPaid.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.paid_invoices_count || 0} paid invoices
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPending.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.pending_invoices_count || 0} pending invoices
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{collectionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Payment efficiency
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invoices Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Manage and track your invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">No invoices found</p>
                  <p className="text-xs text-gray-400 mb-4">Create your first invoice to get started</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.invoiceNo} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium">{invoice.invoiceNo}</p>
                            <p className="text-sm text-gray-500">{invoice.customerName}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">${invoice.grandTotal?.toLocaleString() || '0'}</p>
                          <p className="text-sm text-gray-500">{invoice.dueDate ? new Date(invoice.dueDate as string).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        
                        <Badge className={getInvoiceStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                        
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Track incoming payments</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <DollarSign className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">No payments recorded</p>
                  <p className="text-xs text-gray-400">Payments will appear here when received</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.payment_number} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getPaymentMethodIcon(payment.payment_method)}
                        <div>
                          <p className="font-medium">{payment.payment_number}</p>
                          <p className="text-sm text-gray-500">{payment.customer_name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">${payment.amount?.toLocaleString() || '0'}</p>
                          <p className="text-sm text-gray-500">{payment.payment_date ? new Date(payment.payment_date as string).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        
                        <Badge className="bg-green-100 text-green-800">
                          {payment.status}
                        </Badge>
                        
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
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
    </div>
  );
}