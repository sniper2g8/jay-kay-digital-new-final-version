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
  Calendar,
  TrendingUp,
  Download
} from "lucide-react";
import Link from "next/link";

// Mock data showcasing human-readable IDs and relationships
const mockInvoices = [
  {
    invoice_no: "JKDP-INV-2024-001",
    customer_human_id: "JKDP-CUS-001",
    customer_name: "ABC Marketing Solutions",
    jobNo: "JKDP-JOB-2024-001",
    amount: 600.00,
    status: "paid",
    issue_date: "2024-01-10",
    due_date: "2024-01-25",
    paid_date: "2024-01-20"
  },
  {
    invoice_no: "JKDP-INV-2024-002",
    customer_human_id: "JKDP-CUS-002", 
    customer_name: "TechStart Inc",
    jobNo: "JKDP-JOB-2024-002",
    amount: 700.00,
    status: "pending",
    issue_date: "2024-01-08",
    due_date: "2024-01-23",
    paid_date: null
  },
  {
    invoice_no: "JKDP-INV-2024-003",
    customer_human_id: "JKDP-CUS-003",
    customer_name: "Local Restaurant Group", 
    jobNo: "JKDP-JOB-2024-003",
    amount: 850.00,
    status: "paid",
    issue_date: "2024-01-05",
    due_date: "2024-01-20",
    paid_date: "2024-01-15"
  }
];

const mockPayments = [
  {
    payment_number: "JKDP-PAY-2024-001",
    customer_human_id: "JKDP-CUS-001",
    customer_name: "ABC Marketing Solutions",
    invoice_no: "JKDP-INV-2024-001",
    amount: 600.00,
    payment_method: "credit_card",
    payment_date: "2024-01-20",
    status: "completed",
    reference: "CC-ending-4532"
  },
  {
    payment_number: "JKDP-PAY-2024-002",
    customer_human_id: "JKDP-CUS-003",
    customer_name: "Local Restaurant Group",
    invoice_no: "JKDP-INV-2024-003", 
    amount: 850.00,
    payment_method: "bank_transfer",
    payment_date: "2024-01-15",
    status: "completed",
    reference: "BT-REF-789456"
  }
];

const getInvoiceStatusColor = (status: string) => {
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
  const totalRevenue = mockInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidInvoices = mockInvoices.filter(inv => inv.status === "paid");
  const pendingInvoices = mockInvoices.filter(inv => inv.status === "pending");
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);

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
                All invoices this year
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
                {paidInvoices.length} paid invoices
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
                {pendingInvoices.length} pending invoices
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round((totalPaid / totalRevenue) * 100)}%</div>
              <p className="text-xs text-muted-foreground">
                Payment efficiency
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Track invoice status and payment progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockInvoices.map((invoice) => (
                <div key={invoice.invoice_no} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{invoice.invoice_no}</h3>
                        <Badge className={getInvoiceStatusColor(invoice.status)}>
                          <div className="flex items-center space-x-1">
                            {invoice.status === "paid" ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            <span>{invoice.status}</span>
                          </div>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {invoice.customer_name} • Job: {invoice.jobNo}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Issued: {new Date(invoice.issue_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Due: {new Date(invoice.due_date).toLocaleDateString()}
                        </div>
                        {invoice.paid_date && (
                          <div className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid: {new Date(invoice.paid_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">${invoice.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {invoice.status === "pending" ? "Amount Due" : "Amount Paid"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payments Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Track payment transactions and methods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPayments.map((payment) => (
                <div key={payment.payment_number} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      {getPaymentMethodIcon(payment.payment_method)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{payment.payment_number}</h3>
                        <Badge className="bg-green-100 text-green-800">
                          {payment.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {payment.customer_name} • Invoice: {payment.invoice_no}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          {getPaymentMethodIcon(payment.payment_method)}
                          <span className="ml-1">{payment.payment_method.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </div>
                        <div>
                          Ref: {payment.reference}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">+${payment.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Payment Received</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Human-Readable Query Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Database Query Examples</CardTitle>
            <CardDescription>How to query financial data using human-readable IDs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Example Queries:</h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="text-blue-600">
                  {/* Get all invoices for a customer */}
                </div>
                <div>
                  supabase.from(&apos;invoices&apos;).select(&apos;*&apos;).eq(&apos;customer_human_id&apos;, &apos;JKDP-CUS-001&apos;)
                </div>
                <div className="text-blue-600 mt-3">
                  {/* Get payments for specific invoice */}
                </div>
                <div>
                  supabase.from(&apos;payments&apos;).select(&apos;*&apos;).eq(&apos;invoice_no&apos;, &apos;JKDP-INV-2024-001&apos;)
                </div>
                <div className="text-blue-600 mt-3">
                  {/* Get customer payment history */}
                </div>
                <div>
                  supabase.from(&apos;payments&apos;).select(&apos;*&apos;).eq(&apos;customer_human_id&apos;, &apos;JKDP-CUS-001&apos;)
                </div>
                <div className="text-blue-600 mt-3">
                  {/* Join invoice with customer data */}
                </div>
                <div>
                  supabase.from(&apos;invoices&apos;).select(&apos;*, customers(business_name)&apos;).eq(&apos;status&apos;, &apos;pending&apos;)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
