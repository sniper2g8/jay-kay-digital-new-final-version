"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Edit,
  Send,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  User,
  Calendar,
  DollarSign,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Eye,
  ExternalLink,
  CreditCard,
  Plus,
  History,
  Receipt,
  Printer,
  Copy,
  Share2,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/constants";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedDashboard from "@/components/ProtectedDashboard";
import { InvoiceTemplate } from "@/components/InvoiceTemplate";
import type { Database } from "@/lib/database-generated.types";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];

interface InvoiceItem {
  id: number;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  job_id?: string;
  job_no?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface InvoiceWithDetails extends Invoice {
  customer?: {
    id: string;
    business_name: string;
    contact_person?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
  } | null;
  invoice_items?: InvoiceItem[] | null;
  payments?: PaymentRecord[] | null;
}

interface PaymentRecord {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number?: string;
  notes?: string;
  received_by?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800 border-green-200";
    case "sent":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "viewed":
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

const getStatusIcon = (status: string) => {
  switch (status) {
    case "paid":
      return <CheckCircle className="h-4 w-4" />;
    case "sent":
      return <FileText className="h-4 w-4" />;
    case "viewed":
      return <Eye className="h-4 w-4" />;
    case "overdue":
      return <AlertCircle className="h-4 w-4" />;
    case "cancelled":
      return <XCircle className="h-4 w-4" />;
    case "draft":
    default:
      return <Clock className="h-4 w-4" />;
  }
};

function InvoiceDetailContent() {
  const params = useParams();
  const invoiceId = params?.id as string;

  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_method: "cash",
    reference_number: "",
    notes: "",
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showTemplateView, setShowTemplateView] = useState(false);

  const fetchInvoiceDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch invoice with customer details and invoice items
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select(
          `
          *,
          customers (
            id,
            business_name,
            contact_person,
            email,
            phone,
            address,
            city,
            state,
            zip_code
          )
        `,
        )
        .eq("id", invoiceId)
        .single();

      if (invoiceError) {
        console.error("Error fetching invoice:", invoiceError);
        setError("Invoice not found");
        return;
      }

      // Fetch invoice items separately using manual query
      const itemsResponse = await fetch("/api/invoice-items/" + invoiceId);
      const itemsData = itemsResponse.ok ? await itemsResponse.json() : [];
      const itemsError = itemsResponse.ok
        ? null
        : new Error("Failed to fetch items");

      if (itemsError) {
        console.error("Error fetching invoice items:", itemsError);
        setError("Error loading invoice items");
        return;
      }

      // Combine the data
      const invoiceWithDetails: InvoiceWithDetails = {
        ...invoiceData,
        // Ensure required fields are present, mapping from actual field names
        invoice_no: invoiceData.invoiceNo || "",
        human_id: invoiceData.customer_id || "",
        amount: invoiceData.total || invoiceData.amountDue || 0,
        issue_date: invoiceData.created_at || "",
        customer: invoiceData.customers
          ? {
              id: invoiceData.customers.id,
              business_name: invoiceData.customers.business_name,
              contact_person: invoiceData.customers.contact_person || undefined,
              email: invoiceData.customers.email || undefined,
              phone: invoiceData.customers.phone || undefined,
              address: invoiceData.customers.address || undefined,
              city: invoiceData.customers.city || undefined,
              state: invoiceData.customers.state || undefined,
              zip_code: invoiceData.customers.zip_code || undefined,
            }
          : undefined,
        customerName:
          invoiceData.customers?.business_name ||
          invoiceData.customerName ||
          "",
        invoiceNo: invoiceData.invoiceNo || "",
        invoice_items: itemsData || [],
        payments: [], // Will be loaded separately
      } as InvoiceWithDetails;

      setInvoice(invoiceWithDetails);
    } catch (err) {
      console.error("Error in fetchInvoiceDetails:", err);
      setError("Failed to load invoice details");
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (!invoiceId) return;

    fetchInvoiceDetails();
  }, [invoiceId, fetchInvoiceDetails]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!invoice) return;

    try {
      const { error } = await supabase
        .from("invoices")
        .update({
          invoice_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoice.id);

      if (error) throw error;

      setInvoice((prev) =>
        prev ? { ...prev, invoice_status: newStatus } : null,
      );

      // Show success message
      alert(`Invoice status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating invoice status:", err);
      alert("Failed to update invoice status");
    }
  };

  const handlePayment = async () => {
    if (!invoice || !paymentForm.amount) return;

    setIsProcessingPayment(true);
    try {
      const paymentAmount = parseFloat(paymentForm.amount);
      const currentPaid = Number(invoice.amountPaid || 0);
      const newAmountPaid = currentPaid + paymentAmount;
      const totalAmount = displayTotal;

      // Create payment record
      const paymentMethodMapping: Record<string, string> = {
        cash: "cash",
        credit_card: "card",
        bank_transfer: "bank_transfer",
        check: "cheque",
        mobile_money: "mobile_money",
      };

      const { error: paymentError } = await supabase.from("payments").insert({
        customer_human_id: invoice.customer?.id || invoice.customer_id || "",
        invoice_no: invoice.invoiceNo || "",
        payment_number: `PAY-${Date.now()}`, // Generate payment number
        amount: paymentAmount,
        payment_method: (paymentMethodMapping[paymentForm.payment_method] ||
          paymentForm.payment_method) as
          | "cash"
          | "bank_transfer"
          | "mobile_money"
          | "card"
          | "cheque"
          | "credit",
        payment_date: new Date().toISOString().split("T")[0], // Date only
        reference_number: paymentForm.reference_number || null,
        notes: paymentForm.notes || null,
        payment_status: "completed",
      });

      if (paymentError) throw paymentError;

      // Update invoice amounts and status
      const newStatus = newAmountPaid >= totalAmount ? "paid" : "partial";
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({
          amountPaid: newAmountPaid,
          invoice_status: newStatus,
          payment_status: newStatus === "paid" ? "paid" : "partial",
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoice.id);

      if (invoiceError) throw invoiceError;

      // Update local state
      setInvoice((prev) =>
        prev
          ? {
              ...prev,
              amountPaid: newAmountPaid,
              invoice_status: newStatus,
              payment_status: newStatus === "paid" ? "paid" : "partial",
            }
          : null,
      );

      // Reset form and close dialog
      setPaymentForm({
        amount: "",
        payment_method: "cash",
        reference_number: "",
        notes: "",
      });
      setShowPaymentDialog(false);

      // Show success message
      alert("Payment recorded successfully");
    } catch (err) {
      console.error("Error processing payment:", err);
      alert("Failed to process payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCopyInvoiceLink = () => {
    const invoiceUrl = `${window.location.origin}/dashboard/invoices/${invoiceId}`;
    navigator.clipboard.writeText(invoiceUrl);
    alert("Invoice link copied to clipboard");
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading invoice...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !invoice) {
    return (
      <DashboardLayout>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {error || "Invoice not found"}
            </h3>
            <p className="text-muted-foreground mb-4">
              The invoice you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have permission to view it.
            </p>
            <Button asChild>
              <Link href="/dashboard/invoices">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Invoices
              </Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate totals from invoice items
  const itemsSubtotal =
    invoice.invoice_items?.reduce(
      (sum, item) => sum + Number(item.total_price),
      0,
    ) || 0;
  const displaySubtotal =
    itemsSubtotal || Number(invoice.subtotal) || Number(invoice.total) || 0;
  const displayTax = Number(invoice.tax) || 0;
  const displayDiscount = Number(invoice.discount) || 0;
  const displayTotal = displaySubtotal + displayTax - displayDiscount;
  const amountPaid = Number(invoice.amountPaid || 0);
  const amountDue = displayTotal - amountPaid;

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <Button variant="outline" size="sm" asChild className="w-fit">
              <Link href="/dashboard/invoices">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Invoices
              </Link>
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              {/* Template View Toggle */}
              <Button
                variant={showTemplateView ? "default" : "outline"}
                size="sm"
                onClick={() => setShowTemplateView(!showTemplateView)}
              >
                <FileText className="h-4 w-4 mr-2" />
                {showTemplateView ? "List View" : "Template View"}
              </Button>

              {/* Print Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>

              {invoice.invoice_status === "draft" && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                  <Button size="sm" onClick={() => handleStatusUpdate("sent")}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invoice
                  </Button>
                </>
              )}

              {invoice.invoice_status !== "paid" &&
                invoice.invoice_status !== "cancelled" && (
                  <>
                    <Dialog
                      open={showPaymentDialog}
                      onOpenChange={setShowPaymentDialog}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="default">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Receive Payment
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Record Payment</DialogTitle>
                          <DialogDescription>
                            Record a payment for{" "}
                            {invoice.invoiceNo ||
                              `Invoice #${invoice.id.slice(0, 8)}`}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="amount">Payment Amount</Label>
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={paymentForm.amount}
                              onChange={(e) =>
                                setPaymentForm((prev) => ({
                                  ...prev,
                                  amount: e.target.value,
                                }))
                              }
                              max={amountDue}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Remaining balance: {formatCurrency(amountDue)}
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="payment_method">
                              Payment Method
                            </Label>
                            <Select
                              value={paymentForm.payment_method}
                              onValueChange={(value) =>
                                setPaymentForm((prev) => ({
                                  ...prev,
                                  payment_method: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="credit_card">
                                  Credit Card
                                </SelectItem>
                                <SelectItem value="bank_transfer">
                                  Bank Transfer
                                </SelectItem>
                                <SelectItem value="check">Check</SelectItem>
                                <SelectItem value="mobile_money">
                                  Mobile Money
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="reference">
                              Reference Number (Optional)
                            </Label>
                            <Input
                              id="reference"
                              placeholder="Transaction ID, Check #, etc."
                              value={paymentForm.reference_number}
                              onChange={(e) =>
                                setPaymentForm((prev) => ({
                                  ...prev,
                                  reference_number: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                              id="notes"
                              placeholder="Additional payment notes..."
                              value={paymentForm.notes}
                              onChange={(e) =>
                                setPaymentForm((prev) => ({
                                  ...prev,
                                  notes: e.target.value,
                                }))
                              }
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setShowPaymentDialog(false)}
                            disabled={isProcessingPayment}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handlePayment}
                            disabled={
                              isProcessingPayment || !paymentForm.amount
                            }
                          >
                            {isProcessingPayment ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Receipt className="h-4 w-4 mr-2" />
                                Record Payment
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate("paid")}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </Button>
                  </>
                )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMoreActions(!showMoreActions)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>More actions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {showMoreActions && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handlePrintInvoice}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Invoice
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleCopyInvoiceLink}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {invoice.invoiceNo || `Invoice #${invoice.id.slice(0, 8)}`}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <Badge
                  variant="outline"
                  className={getStatusColor(invoice.invoice_status || "draft")}
                >
                  {getStatusIcon(invoice.invoice_status || "draft")}
                  <span className="ml-1 capitalize">
                    {invoice.invoice_status || "draft"}
                  </span>
                </Badge>
                <span className="text-muted-foreground text-sm">
                  Created {formatDate(invoice.created_at || new Date())}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {formatCurrency(displayTotal)}
              </div>
              {amountPaid > 0 && (
                <div className="text-sm text-green-600">
                  {formatCurrency(amountPaid)} paid
                </div>
              )}
              {amountDue > 0 && (
                <div className="text-sm text-orange-600">
                  {formatCurrency(amountDue)} outstanding
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conditional Template View */}
        {showTemplateView ? (
          <div className="mt-8">
            <InvoiceTemplate
              invoice={{
                id: invoice.id,
                invoiceNo: invoice.invoiceNo ?? undefined,
                created_at: invoice.created_at ?? "",
                invoice_date: invoice.invoice_date ?? undefined,
                invoice_status: invoice.invoice_status ?? undefined,
                terms_days: invoice.terms_days ?? undefined,
                notes: invoice.notes ?? undefined,
                subtotal: displaySubtotal,
                tax: displayTax,
                discount: displayDiscount,
                total: displayTotal,
                amountPaid: amountPaid,
              }}
              customer={invoice.customer ? {
                business_name: invoice.customer.business_name,
                contact_person: invoice.customer.contact_person ?? undefined,
                email: invoice.customer.email ?? undefined,
                phone: invoice.customer.phone ?? undefined,
                address: invoice.customer.address ?? undefined,
                city: invoice.customer.city ?? undefined,
                state: invoice.customer.state ?? undefined,
                zip_code: invoice.customer.zip_code ?? undefined,
              } : undefined}
              items={invoice.invoice_items || []}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Invoice Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Items</CardTitle>
                    <CardDescription>
                      {invoice.invoice_items?.length || 0} item(s) on this
                      invoice
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {invoice.invoice_items &&
                    invoice.invoice_items.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Description</TableHead>
                              <TableHead>Job #</TableHead>
                              <TableHead className="text-right">Qty</TableHead>
                              <TableHead className="text-right">
                                Unit Price
                              </TableHead>
                              <TableHead className="text-right">
                                Total
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoice.invoice_items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {item.description}
                                    </div>
                                    {item.notes && (
                                      <div className="text-sm text-muted-foreground mt-1">
                                        {item.notes}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {item.job_no && item.job_no !== "N/A" ? (
                                    <Link
                                      href={`/dashboard/jobs?search=${item.job_no}`}
                                      className="text-primary hover:underline flex items-center"
                                    >
                                      {item.job_no}
                                      <ExternalLink className="h-3 w-3 ml-1" />
                                    </Link>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {Number(item.quantity).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(Number(item.unit_price))}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(Number(item.total_price))}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="text-right font-medium"
                              >
                                Subtotal
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(displaySubtotal)}
                              </TableCell>
                            </TableRow>
                            {displayTax > 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-right">
                                  Tax ({invoice.taxRate || 0}%)
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(displayTax)}
                                </TableCell>
                              </TableRow>
                            )}
                            {displayDiscount > 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-right">
                                  Discount
                                </TableCell>
                                <TableCell className="text-right text-red-600">
                                  -{formatCurrency(displayDiscount)}
                                </TableCell>
                              </TableRow>
                            )}
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="text-right font-bold"
                              >
                                Total
                              </TableCell>
                              <TableCell className="text-right font-bold text-lg">
                                {formatCurrency(displayTotal)}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">
                          No items found on this invoice
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notes & Payment History */}
                <div className="space-y-6">
                  {invoice.notes && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">
                          {invoice.notes}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Payment History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <History className="h-5 w-5 mr-2" />
                        Payment History
                      </CardTitle>
                      <CardDescription>
                        Track all payments received for this invoice
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {amountPaid > 0 ? (
                        <div className="space-y-4">
                          <div className="rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-green-600">
                                  {formatCurrency(amountPaid)} Received
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Payment recorded
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            </div>
                          </div>

                          {amountDue > 0 && (
                            <div className="rounded-lg border-2 border-dashed border-orange-200 p-4 bg-orange-50">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                  <p className="font-medium text-orange-600">
                                    {formatCurrency(amountDue)} Outstanding
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Remaining balance due
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setPaymentForm((prev) => ({
                                      ...prev,
                                      amount: amountDue.toString(),
                                    }));
                                    setShowPaymentDialog(true);
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Record Payment
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground mb-4">
                            No payments recorded yet
                          </p>
                          <Button
                            size="sm"
                            onClick={() => {
                              setPaymentForm((prev) => ({
                                ...prev,
                                amount: displayTotal.toString(),
                              }));
                              setShowPaymentDialog(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Record First Payment
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Invoice Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Invoice Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Invoice Date
                      </label>
                      <p className="text-sm">
                        {invoice.invoice_date
                          ? formatDate(invoice.invoice_date)
                          : "Not set"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Due Date
                      </label>
                      <p className="text-sm">
                        {invoice.due_date
                          ? formatDate(invoice.due_date)
                          : "Not set"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Payment Terms
                      </label>
                      <p className="text-sm">
                        {invoice.terms_days
                          ? `Net ${invoice.terms_days} days`
                          : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Currency
                      </label>
                      <p className="text-sm">{invoice.currency || "SLL"}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Business Name
                      </label>
                      <p className="text-sm font-medium">
                        {invoice.customer?.business_name ||
                          invoice.customerName ||
                          "Unknown Customer"}
                      </p>
                    </div>
                    {invoice.customer?.contact_person && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Contact Person
                        </label>
                        <p className="text-sm">
                          {invoice.customer.contact_person}
                        </p>
                      </div>
                    )}
                    {invoice.customer?.email && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Email
                        </label>
                        <p className="text-sm flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          <a
                            href={`mailto:${invoice.customer.email}`}
                            className="text-primary hover:underline"
                          >
                            {invoice.customer.email}
                          </a>
                        </p>
                      </div>
                    )}
                    {invoice.customer?.phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Phone
                        </label>
                        <p className="text-sm flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          <a
                            href={`tel:${invoice.customer.phone}`}
                            className="text-primary hover:underline"
                          >
                            {invoice.customer.phone}
                          </a>
                        </p>
                      </div>
                    )}
                    {invoice.customer?.address && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Address
                        </label>
                        <p className="text-sm flex items-start">
                          <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                          <span>
                            {invoice.customer.address}
                            {invoice.customer.city &&
                              `, ${invoice.customer.city}`}
                            {invoice.customer.state &&
                              `, ${invoice.customer.state}`}
                            {invoice.customer.zip_code &&
                              ` ${invoice.customer.zip_code}`}
                          </span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Subtotal
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(displaySubtotal)}
                      </span>
                    </div>
                    {displayTax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Tax
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(displayTax)}
                        </span>
                      </div>
                    )}
                    {displayDiscount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Discount
                        </span>
                        <span className="text-sm font-medium text-red-600">
                          -{formatCurrency(displayDiscount)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm font-bold">Total</span>
                      <span className="text-sm font-bold">
                        {formatCurrency(displayTotal)}
                      </span>
                    </div>
                    {amountPaid > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Amount Paid
                          </span>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(amountPaid)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            Amount Due
                          </span>
                          <span className="text-sm font-bold">
                            {formatCurrency(amountDue)}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function InvoiceDetailPage() {
  return (
    <ProtectedDashboard
      allowedRoles={["staff", "manager", "admin", "super_admin"]}
    >
      <InvoiceDetailContent />
    </ProtectedDashboard>
  );
}
