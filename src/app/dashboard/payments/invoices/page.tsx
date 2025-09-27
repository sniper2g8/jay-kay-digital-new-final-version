"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfessionalInvoicePDF } from "@/components/ProfessionalInvoicePDF";
import { formatCurrency, formatDate } from "@/lib/constants";
import {
  ArrowLeft,
  Plus,
  Search,
  FileText,
  Eye,
  Edit,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNo: string;
  customer_id: string | null;
  customerName?: string;
  due_date: string | null;
  status: string;
  payment_status: string;
  total: number;
  amountPaid: number;
  currency: string;
  notes?: string;
  created_at: string | null;
  updated_at: string | null;
}

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  job_no?: string;
  notes?: string;
}

interface Customer {
  business_name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
}

export default function InvoiceManagementPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    paidAmount: 0,
    overdueAmount: 0,
    pendingAmount: 0,
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [invoices]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
          id,
          invoiceNo,
          customer_id,
          customerName,
          due_date,
          status,
          payment_status,
          total,
          amountPaid,
          currency,
          notes,
          created_at,
          updated_at,
          customers (
            business_name
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const processedInvoices =
        data?.map((invoice) => ({
          id: invoice.id,
          invoiceNo: invoice.invoiceNo || `JKDP-INV-${invoice.id.slice(0, 8)}`,
          customer_id: invoice.customer_id,
          customerName:
            invoice.customerName ||
            invoice.customers?.business_name ||
            "Unknown Customer",
          due_date:
            invoice.due_date || invoice.created_at || new Date().toISOString(),
          status: invoice.status || "draft",
          payment_status: invoice.payment_status || "pending",
          total: invoice.total || 0,
          amountPaid: invoice.amountPaid || 0,
          currency: invoice.currency || "SLL",
          notes: invoice.notes || undefined,
          created_at: invoice.created_at,
          updated_at: invoice.updated_at,
        })) || [];

      setInvoices(processedInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetails = async (invoiceId: string) => {
    try {
      console.log("Fetching invoice items for invoice:", invoiceId);
      // Prefer API route to ensure stable server environment and consistent response shape
      const res = await fetch(`/api/invoice-items/${invoiceId}`);
      const rawText = await res.text();
      let itemsPayload: any = undefined;
      try {
        itemsPayload = rawText ? JSON.parse(rawText) : null;
      } catch (_e) {
        console.warn("Items response is not valid JSON, raw:", rawText);
      }
      if (!res.ok) {
        console.error("Error fetching items:", {
          status: res.status,
          statusText: res.statusText,
          body: itemsPayload ?? rawText,
        });
        throw new Error(`Items request failed: ${res.status}`);
      }

      const processedItems = (itemsPayload || []).map((item: any) => ({
        id: item.id,
        description: item.description || "No description",
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        total_price: Number(item.total_price) || 0,
        job_no: item.job_no || undefined,
        notes: item.notes || undefined,
      }));

      console.log("Processed items:", processedItems);
      setInvoiceItems(processedItems);

      // Fetch customer details for selected invoice
      const invoice = invoices.find((inv) => inv.id === invoiceId);
      console.log("Found invoice:", invoice);

      if (invoice?.customer_id) {
        console.log("Fetching customer details for:", invoice.customer_id);
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select(
            `
            id,
            business_name,
            contact_person,
            email,
            phone,
            address,
            city,
            state,
            zip_code
          `,
          )
          .eq("id", invoice.customer_id)
          .single();

        if (customerError) {
          console.error("Error fetching customer:", customerError);
        } else {
          console.log("Fetched customer data:", customerData);
          setCustomer(customerData);
        }
      }
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      alert("Failed to load invoice details. Please try again.");
    }
  };

  const calculateStats = () => {
    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + (inv.total || 0),
      0,
    );
    const paidAmount = invoices.reduce(
      (sum, inv) => sum + (inv.amountPaid || 0),
      0,
    );
    const overdueInvoices = invoices.filter(
      (inv) =>
        inv.payment_status === "overdue" ||
        (inv.due_date &&
          new Date(inv.due_date) < new Date() &&
          inv.payment_status !== "paid"),
    );
    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + ((inv.total || 0) - (inv.amountPaid || 0)),
      0,
    );
    const pendingAmount = totalRevenue - paidAmount;

    setStats({
      totalInvoices: invoices.length,
      totalRevenue,
      paidAmount,
      overdueAmount,
      pendingAmount,
    });
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;
    const matchesPayment =
      paymentFilter === "all" || invoice.payment_status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleViewInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    await fetchInvoiceDetails(invoice.id);
    setShowPreview(true);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "partial":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "sent":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "draft":
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "partial":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (showPreview && selectedInvoice) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => setShowPreview(false)}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Invoices</span>
          </Button>
          <h1 className="text-2xl font-bold">Invoice Preview & PDF Download</h1>
        </div>

        <ProfessionalInvoicePDF
          invoice={{
            id: selectedInvoice.id,
            invoiceNo: selectedInvoice.invoiceNo,
            created_at: selectedInvoice.created_at || new Date().toISOString(),
            invoice_date:
              selectedInvoice.created_at || new Date().toISOString(),
            invoice_status: selectedInvoice.status,
            payment_status: selectedInvoice.payment_status,
            terms_days: 30,
            notes: selectedInvoice.notes,
            total: selectedInvoice.total,
            amountPaid: selectedInvoice.amountPaid,
            currency: selectedInvoice.currency,
          }}
          customer={
            customer
              ? {
                  business_name: customer.business_name,
                  contact_person: customer.contact_person || undefined,
                  email: customer.email || undefined,
                  phone: customer.phone || undefined,
                  address: customer.address || undefined,
                  city: customer.city || undefined,
                  state: customer.state || undefined,
                  zip_code: customer.zip_code || undefined,
                }
              : undefined
          }
          items={invoiceItems}
          showActions={true}
        />
        {/* Removed extra PDF download buttons as requested */}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Payments</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Invoice Management
            </h1>
            <p className="text-gray-600">
              Manage and generate professional invoices with PDF export
            </p>
          </div>
        </div>
        <Button className="flex items-center space-x-2 bg-red-600 hover:bg-red-700">
          <Plus className="h-4 w-4" />
          <span>Create Invoice</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Invoices
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalInvoices}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.paidAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(stats.pendingAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.overdueAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search invoices by number, customer, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Invoices ({filteredInvoices.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No invoices found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                  ? "No invoices match your current filters."
                  : "Get started by creating your first invoice."}
              </p>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {invoice.invoiceNo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invoice.customerName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(
                          invoice.created_at || new Date().toISOString(),
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(
                          invoice.due_date || new Date().toISOString(),
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status?.charAt(0).toUpperCase() +
                            invoice.status?.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={getPaymentStatusColor(
                            invoice.payment_status,
                          )}
                        >
                          {invoice.payment_status?.charAt(0).toUpperCase() +
                            invoice.payment_status?.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewInvoice(invoice)}
                            className="flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View PDF</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(
                                `/dashboard/invoices/${invoice.id}/edit?number=${encodeURIComponent(invoice.invoiceNo)}`,
                              )
                            }
                            className="flex items-center space-x-1"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
